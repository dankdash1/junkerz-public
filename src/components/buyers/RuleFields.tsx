"use client";
// Fields shared by the new and edit bid-rule pages: vehicle types, the year
// range, and where the car is (a circle around a town, or exact ZIP codes).
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi, type Place } from "@/lib/buyer-api";

export function Chip({
  on,
  onClick,
  title,
  children,
}: {
  on: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      title={title}
      className={`px-3 py-1 rounded border text-sm ${
        on ? "bg-brand-600 text-white border-brand-700" : "bg-white text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// ---- vehicle types -------------------------------------------------------

const VEHICLE_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "car", label: "All cars" },
  { value: "truck", label: "All trucks" },
  { value: "suv", label: "All SUVs" },
  { value: "van", label: "All vans" },
];

export function VehicleTypesField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <Label>Vehicle types</Label>
      <div className="flex flex-wrap gap-2 mt-1">
        <Chip on={value.length === 0} onClick={() => onChange([])}>
          All vehicles
        </Chip>
        {VEHICLE_CATEGORIES.map((cat) => {
          const on = value.includes(cat.value);
          return (
            <Chip
              key={cat.value}
              on={on}
              onClick={() =>
                onChange(on ? value.filter((v) => v !== cat.value) : [...value, cat.value])
              }
            >
              {cat.label}
            </Chip>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        All vehicles takes every type. Or pick one or more, like just trucks.
      </p>
    </div>
  );
}

// ---- years ---------------------------------------------------------------

const NEWEST_YEAR = new Date().getFullYear() + 1;

export function yearRangeProblem(min: string, max: string): string | null {
  for (const [label, v] of [["From year", min], ["To year", max]] as const) {
    if (v && !(/^\d{4}$/.test(v) && Number(v) >= 1900 && Number(v) <= NEWEST_YEAR)) {
      return `${label} must be a 4-digit year between 1900 and ${NEWEST_YEAR}.`;
    }
  }
  if (min && max && Number(min) > Number(max)) {
    return "From year must be the same as or before To year.";
  }
  return null;
}

const OLDEST_YEAR = 1960;
const YEAR_OPTIONS: string[] = [];
for (let y = NEWEST_YEAR; y >= OLDEST_YEAR; y--) YEAR_OPTIONS.push(String(y));

function YearSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // A saved year outside the list (an old rule) still shows, so it is never
  // silently dropped when the buyer saves the page.
  const options =
    value && !YEAR_OPTIONS.includes(value) ? [value, ...YEAR_OPTIONS] : YEAR_OPTIONS;
  return (
    <label className="text-sm text-slate-700">
      {label}
      <select
        className="mt-1 w-full border rounded h-10 px-2 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">Any</option>
        {options.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
  );
}

export function YearRangeField({
  yearMin,
  yearMax,
  onChange,
}: {
  yearMin: string;
  yearMax: string;
  onChange: (min: string, max: string) => void;
}) {
  const problem = yearRangeProblem(yearMin, yearMax);
  return (
    <div>
      <Label>Years</Label>
      <div className="grid grid-cols-2 gap-3 mt-1">
        <YearSelect label="From year:" value={yearMin} onChange={(v) => onChange(v, yearMax)} />
        <YearSelect label="To year:" value={yearMax} onChange={(v) => onChange(yearMin, v)} />
      </div>
      {problem ? (
        <p className="text-xs text-red-600 mt-1">{problem}</p>
      ) : (
        <p className="text-xs text-slate-500 mt-1">
          Pick a range, like 2015 to 2020. Leave Any for no limit.
        </p>
      )}
    </div>
  );
}

// ---- where the car is ----------------------------------------------------

export type WhereValue = {
  area_codes: string[];
  zip_codes: string;
  zip_center: string;
  zip_radius_miles: string;
};

export function parseZipList(text: string): string[] {
  return text
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isZipEntry(s: string): boolean {
  if (/^\d{5}$/.test(s) || /^\d{3,4}$/.test(s)) return true;
  const m = /^(\d{5})-(\d{5})$/.exec(s);
  return !!m && m[1] <= m[2];
}

export function whereProblem(v: WhereValue): string | null {
  const bad = parseZipList(v.zip_codes).filter((z) => !isZipEntry(z));
  if (bad.length) return `Not a ZIP code, prefix or range: ${bad.join(", ")}`;
  const center = v.zip_center.trim();
  if (center && !/^\d{5}$/.test(center)) return "Pick the town for the circle from the list.";
  if (v.zip_radius_miles && !center) return "Pick the town for the circle from the list.";
  if (center && !v.zip_radius_miles) return "Type how many miles the circle reaches.";
  return null;
}

// A circle: "Take cars within [50] miles of [Fort Worth, TX]".
// Stored as a centre ZIP — the ZIP nearest the middle of the town picked.
function TownCircle({
  zipCenter,
  miles,
  onChange,
}: {
  zipCenter: string;
  miles: string;
  onChange: (patch: Partial<WhereValue>) => void;
}) {
  const [text, setText] = useState("");
  const [townName, setTownName] = useState<string | null>(null);
  const [unknownZip, setUnknownZip] = useState(false);
  const [results, setResults] = useState<Place[]>([]);
  const typed = useRef(false);

  // Name the saved centre, and fill the box with it when the page opens.
  useEffect(() => {
    const z = zipCenter.trim();
    setUnknownZip(false);
    if (!/^\d{5}$/.test(z)) {
      setTownName(null);
      return;
    }
    let live = true;
    buyerApi
      .zipLookup(z)
      .then((r) => {
        if (!live) return;
        const name = `${r.city}, ${r.state}`;
        setTownName(name);
        if (!typed.current) setText(name);
      })
      .catch((e: Error) => {
        if (live && e.message === "unknown_zip") setUnknownZip(true);
      });
    return () => {
      live = false;
    };
  }, [zipCenter]);

  // Search towns as the buyer types.
  useEffect(() => {
    const q = text.trim();
    if (!typed.current || q.length < 2 || /^\d+$/.test(q)) {
      setResults([]);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      buyerApi
        .places(q)
        .then((r) => live && setResults(r.places ?? []))
        .catch(() => live && setResults([]));
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [text]);

  function type(v: string) {
    typed.current = true;
    setText(v);
    const s = v.trim();
    // A 5-digit ZIP works straight away; a town must be picked from the list.
    onChange({ zip_center: /^\d{5}$/.test(s) ? s : "" });
  }

  function pick(p: Place) {
    typed.current = false;
    setText(`${p.city}, ${p.state}`);
    setResults([]);
    onChange({ zip_center: p.zip });
  }

  return (
    <div>
      <Label>Circle around a town or city</Label>
      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-700">
        <span>Take cars within</span>
        <Input
          className="w-20"
          inputMode="numeric"
          value={miles}
          onChange={(e) => onChange({ zip_radius_miles: e.target.value.replace(/\D/g, "") })}
          placeholder="50"
          aria-label="Miles"
        />
        <span>miles of</span>
      </div>
      <div className="relative mt-2">
        <Input
          value={text}
          onChange={(e) => type(e.target.value)}
          placeholder="Type a town or city, like Fort Worth"
          aria-label="Town or city"
          autoComplete="off"
        />
        {results.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded border bg-white shadow">
            {results.map((p) => (
              <li key={`${p.city}-${p.state}`}>
                <button
                  type="button"
                  onClick={() => pick(p)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                >
                  {p.city}, {p.state}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {townName && miles && (
        <p className="text-xs text-slate-600 mt-1">
          Cars within {miles} miles of {townName} count.
        </p>
      )}
      {unknownZip && (
        <p className="text-xs text-red-600 mt-1">
          We can&apos;t find ZIP {zipCenter.trim()}. This circle would match no cars.
        </p>
      )}
      {typed.current && text.trim() && !zipCenter && results.length === 0 && text.trim().length >= 2 && (
        <p className="text-xs text-slate-500 mt-1">Keep typing, then pick the town from the list.</p>
      )}
    </div>
  );
}

export function WhereField({
  value,
  onChange,
}: {
  value: WhereValue;
  onChange: (patch: Partial<WhereValue>) => void;
}) {
  const [showZips, setShowZips] = useState(Boolean(value.zip_codes.trim()));

  const problem = whereProblem(value);
  const anywhere =
    !value.area_codes.length &&
    !value.zip_codes.trim() &&
    !(value.zip_center.trim() && value.zip_radius_miles);

  return (
    <div className="border rounded p-4 space-y-4 bg-slate-50">
      <div>
        <h2 className="font-semibold text-slate-800">Where the car is</h2>
        <p className="text-xs text-slate-500">
          A car counts if it matches any one of these.
        </p>
      </div>

      <TownCircle
        zipCenter={value.zip_center}
        miles={value.zip_radius_miles}
        onChange={onChange}
      />

      {value.area_codes.length > 0 && (
        <p className="text-xs text-slate-600 bg-white border rounded p-2 flex flex-wrap items-center gap-2">
          <span>
            This rule also takes area codes <strong>{value.area_codes.join(", ")}</strong>{" "}
            (an older setting).
          </span>
          <button
            type="button"
            onClick={() => onChange({ area_codes: [] })}
            className="underline"
          >
            Remove area codes
          </button>
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowZips(!showZips)}
          className="text-sm text-slate-700 underline"
          aria-expanded={showZips}
        >
          {showZips ? "Hide exact ZIP codes" : "Add exact ZIP codes (optional)"}
        </button>
        {showZips && (
          <div className="mt-2">
            <Input
              value={value.zip_codes}
              onChange={(e) => onChange({ zip_codes: e.target.value })}
              placeholder="75201, 752, 76001-76099"
              aria-label="ZIP codes"
            />
            <p className="text-xs text-slate-500 mt-1">
              A full ZIP (75201), the first 3 digits for a whole area (752 = all of
              Dallas), or a range (76001-76099). Separate them with commas.
            </p>
          </div>
        )}
      </div>

      {problem && <p className="text-sm text-red-600">{problem}</p>}
      {anywhere && !problem && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
          No area set. This rule takes cars from anywhere.
        </p>
      )}
    </div>
  );
}

// ---- one-line summary for the rules list ---------------------------------

export function ruleSummary(r: {
  vehicle_categories?: string[] | null;
  year_min?: number | null;
  year_max?: number | null;
  makes?: string[] | null;
  area_codes?: string[] | null;
  zip_codes?: string[] | null;
  zip_center?: string | null;
  zip_radius_miles?: number | null;
}): string {
  const types = r.vehicle_categories?.length ? r.vehicle_categories.join("/") : "all vehicles";
  const years =
    r.year_min || r.year_max ? `${r.year_min ?? "any"}–${r.year_max ?? "newest"}` : "any year";
  const makes = r.makes?.length ? r.makes.join(", ") : "any make";
  const where: string[] = [];
  if (r.zip_center && r.zip_radius_miles) where.push(`${r.zip_radius_miles} mi of ${r.zip_center}`);
  if (r.area_codes?.length) where.push(`area ${r.area_codes.join(", ")}`);
  if (r.zip_codes?.length) {
    where.push(`ZIPs ${r.zip_codes.slice(0, 3).join(", ")}${r.zip_codes.length > 3 ? "…" : ""}`);
  }
  return `${types} · ${years} · ${makes} · ${where.length ? where.join(" or ") : "anywhere"}`;
}
