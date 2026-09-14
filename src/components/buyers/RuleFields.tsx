"use client";
// Fields shared by the new and edit bid-rule pages: vehicle types, the year
// range, and where the car is (area codes, a circle of miles, ZIP codes).
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi, type AreaCodeGroup } from "@/lib/buyer-api";

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

const SELECT = "h-8 rounded-lg border border-input bg-white px-2 text-sm";

// ---- vehicle types -------------------------------------------------------

const VEHICLE_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "car", label: "Cars" },
  { value: "truck", label: "Trucks" },
  { value: "suv", label: "SUVs" },
  { value: "van", label: "Vans" },
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
              All {cat.label.toLowerCase()}
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

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR + 2 - 1950 }, (_, i) => String(THIS_YEAR + 1 - i));
const YEAR_PRESETS = [
  { label: "Any year", min: "", max: "" },
  { label: "1999 & older", min: "", max: "1999" },
  { label: "2000–2009", min: "2000", max: "2009" },
  { label: "2010–2014", min: "2010", max: "2014" },
  { label: "2015–2020", min: "2015", max: "2020" },
  { label: "2021 & newer", min: "2021", max: "" },
];

export function yearRangeProblem(min: string, max: string): string | null {
  if (min && max && Number(min) > Number(max)) {
    return "The first year must be before the second year.";
  }
  return null;
}

function YearSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  // Keep an old saved year selectable even if it is outside the list.
  const years = value && !YEARS.includes(value) ? [value, ...YEARS] : YEARS;
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={SELECT}
    >
      <option value="">Any</option>
      {years.map((y) => (
        <option key={y} value={y}>
          {y}
        </option>
      ))}
    </select>
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
      <div className="flex flex-wrap gap-2 mt-1">
        {YEAR_PRESETS.map((p) => (
          <Chip
            key={p.label}
            on={yearMin === p.min && yearMax === p.max}
            onClick={() => onChange(p.min, p.max)}
          >
            {p.label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-700">
        <span>From</span>
        <YearSelect label="From year" value={yearMin} onChange={(v) => onChange(v, yearMax)} />
        <span>to</span>
        <YearSelect label="To year" value={yearMax} onChange={(v) => onChange(yearMin, v)} />
      </div>
      {problem ? (
        <p className="text-xs text-red-600 mt-1">{problem}</p>
      ) : (
        <p className="text-xs text-slate-500 mt-1">
          Tap a range, or set your own, like 2015 to 2020.
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
  if (center && !/^\d{5}$/.test(center)) return "The circle's ZIP code must be 5 digits.";
  if (Boolean(center) !== Boolean(v.zip_radius_miles)) {
    return "Set both the ZIP code and the miles for the circle, or clear both.";
  }
  return null;
}

const MILES = [10, 25, 50, 75, 100, 150];

export function WhereField({
  value,
  onChange,
}: {
  value: WhereValue;
  onChange: (patch: Partial<WhereValue>) => void;
}) {
  // null = this API does not have area codes yet, so the chips stay hidden.
  const [groups, setGroups] = useState<AreaCodeGroup[] | null>(null);
  useEffect(() => {
    buyerApi
      .areaCodes()
      .then((r) => setGroups(r.area_codes ?? []))
      .catch(() => setGroups(null));
  }, []);

  const [centerName, setCenterName] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    const z = value.zip_center.trim();
    setCenterName(null);
    if (!/^\d{5}$/.test(z)) return;
    let live = true;
    const t = setTimeout(() => {
      buyerApi
        .zipLookup(z)
        .then((r) => live && setCenterName({ ok: true, text: `${r.city}, ${r.state}` }))
        .catch((e: Error) => {
          if (live && e.message === "unknown_zip") setCenterName({ ok: false, text: "" });
        });
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [value.zip_center]);

  const picked = (groups ?? []).filter((g) => value.area_codes.includes(g.key));
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

      {groups && groups.length > 0 && (
        <div>
          <Label>Area codes</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {groups.map((g) => {
              const on = value.area_codes.includes(g.key);
              return (
                <Chip
                  key={g.key}
                  on={on}
                  title={g.label}
                  onClick={() =>
                    onChange({
                      area_codes: on
                        ? value.area_codes.filter((k) => k !== g.key)
                        : [...value.area_codes, g.key],
                    })
                  }
                >
                  <span className="font-semibold">{g.codes.join(" · ")}</span>{" "}
                  <span className="text-xs opacity-80">{g.label}</span>
                </Chip>
              );
            })}
          </div>
          {picked.map((g) => (
            <p key={g.key} className="text-xs text-slate-600 mt-2">
              <strong>{g.codes.join("/")}</strong> covers {g.towns.length} towns:{" "}
              {g.towns.join(", ")}.
            </p>
          ))}
        </div>
      )}

      <div>
        <Label>Miles around a ZIP code</Label>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <Input
            value={value.zip_center}
            onChange={(e) => onChange({ zip_center: e.target.value })}
            placeholder="Your yard ZIP, e.g. 75201"
            inputMode="numeric"
            maxLength={5}
            aria-label="Circle centre ZIP code"
          />
          <Input
            type="number"
            min="1"
            value={value.zip_radius_miles}
            onChange={(e) => onChange({ zip_radius_miles: e.target.value })}
            placeholder="Miles"
            aria-label="Miles"
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {MILES.map((m) => (
            <Chip
              key={m}
              on={value.zip_radius_miles === String(m)}
              onClick={() => onChange({ zip_radius_miles: String(m) })}
            >
              {m} mi
            </Chip>
          ))}
        </div>
        {centerName?.ok && (
          <p className="text-xs text-slate-600 mt-1">
            {value.zip_center.trim()} is {centerName.text}
            {value.zip_radius_miles
              ? `. Cars within ${value.zip_radius_miles} miles of it count.`
              : "."}
          </p>
        )}
        {centerName && !centerName.ok && (
          <p className="text-xs text-red-600 mt-1">
            We can&apos;t find ZIP {value.zip_center.trim()}. This circle would match no cars.
          </p>
        )}
      </div>

      <div>
        <Label>ZIP codes</Label>
        <Input
          value={value.zip_codes}
          onChange={(e) => onChange({ zip_codes: e.target.value })}
          placeholder="75201, 752, 76001-76099"
          className="mt-1"
        />
        <p className="text-xs text-slate-500 mt-1">
          A full ZIP (75201), the first 3 digits for a whole area (752 = all of
          Dallas), or a range (76001-76099). Separate them with commas.
        </p>
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
  if (r.area_codes?.length) where.push(`area ${r.area_codes.join(", ")}`);
  if (r.zip_center && r.zip_radius_miles) where.push(`${r.zip_radius_miles} mi of ${r.zip_center}`);
  if (r.zip_codes?.length) {
    where.push(`ZIPs ${r.zip_codes.slice(0, 3).join(", ")}${r.zip_codes.length > 3 ? "…" : ""}`);
  }
  return `${types} · ${years} · ${makes} · ${where.length ? where.join(" or ") : "anywhere"}`;
}
