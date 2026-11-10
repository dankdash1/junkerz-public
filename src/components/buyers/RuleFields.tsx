"use client";
// Fields shared by the new and edit bid-rule pages: vehicle types, year
// dropdowns, and where the car is (a circle around a town, or exact ZIP codes).
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi, type Place } from "@/lib/buyer-api";
import type { Lang } from "@/lib/buyer-lang";
import { ruleText } from "@/components/buyers/ruleText";
import { describeWants, wantsFromRule, type RuleVehicleFields } from "@/lib/rule-wants";

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

// 2026-11-09: "All trucks" read as "every truck, whatever the make"; with makes
// picked a type only narrows them (Trucks + Toyota = Toyota trucks), so the
// buttons say Cars / Trucks / SUVs / Vans.
const VEHICLE_CATEGORIES = ["car", "truck", "suv", "van"];

export function VehicleTypesField({
  value,
  onChange,
  lang = "en",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  lang?: Lang;
}) {
  const t = ruleText(lang);
  return (
    <div>
      <Label>{t.vehicleTypes}</Label>
      <div className="flex flex-wrap gap-2 mt-1">
        <Chip on={value.length === 0} onClick={() => onChange([])}>
          {t.typeAll}
        </Chip>
        {VEHICLE_CATEGORIES.map((cat) => {
          const on = value.includes(cat);
          return (
            <Chip
              key={cat}
              on={on}
              onClick={() => onChange(on ? value.filter((v) => v !== cat) : [...value, cat])}
            >
              {t.typeNames[cat]}
            </Chip>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-1">{t.typesHelp}</p>
    </div>
  );
}

// ---- years ---------------------------------------------------------------

const NEWEST_YEAR = new Date().getFullYear() + 1;

export function yearRangeProblem(min: string, max: string, lang: Lang = "en"): string | null {
  const t = ruleText(lang);
  for (const [label, v] of [[t.yearFrom, min], [t.yearTo, max]] as const) {
    if (v && !(/^\d{4}$/.test(v) && Number(v) >= 1900 && Number(v) <= NEWEST_YEAR)) {
      return t.badYear(label, NEWEST_YEAR);
    }
  }
  if (min && max && Number(min) > Number(max)) {
    return t.yearOrder;
  }
  return null;
}

const OLDEST_YEAR = 1960;
const YEAR_OPTIONS: string[] = [];
for (let y = NEWEST_YEAR; y >= OLDEST_YEAR; y--) YEAR_OPTIONS.push(String(y));

export function YearSelect({
  label,
  value,
  onChange,
  lang = "en",
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  lang?: Lang;
  hideLabel?: boolean;
}) {
  // A saved year outside the list (an old rule) still shows, so it is never
  // silently dropped when the buyer saves the page.
  const options =
    value && !YEAR_OPTIONS.includes(value) ? [value, ...YEAR_OPTIONS] : YEAR_OPTIONS;
  return (
    <label className="text-sm text-slate-700">
      {hideLabel ? null : label}
      <select
        className="mt-1 w-full border rounded h-10 px-2 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      >
        <option value="">{ruleText(lang).any}</option>
        {options.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </label>
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

export function whereProblem(v: WhereValue, lang: Lang = "en"): string | null {
  const t = ruleText(lang);
  const bad = parseZipList(v.zip_codes).filter((z) => !isZipEntry(z));
  if (bad.length) return t.notZip(bad.join(", "));
  const center = v.zip_center.trim();
  if (center && !/^\d{5}$/.test(center)) return t.pickTown;
  if (v.zip_radius_miles && !center) return t.pickTown;
  if (center && !v.zip_radius_miles) return t.typeMiles;
  return null;
}

// A circle: "Take cars within [50] miles of [Fort Worth, TX]".
// Stored as a centre ZIP — the ZIP nearest the middle of the town picked.
function TownCircle({
  zipCenter,
  miles,
  onChange,
  lang,
}: {
  zipCenter: string;
  miles: string;
  onChange: (patch: Partial<WhereValue>) => void;
  lang: Lang;
}) {
  const t = ruleText(lang);
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
    const zip = /^\d{5}$/.test(s) ? s : "";
    onChange(zip && !miles ? { zip_center: zip, zip_radius_miles: "50" } : { zip_center: zip });
  }

  function pick(p: Place) {
    typed.current = false;
    setText(`${p.city}, ${p.state}`);
    setResults([]);
    // The box showed a grey "50" that was never saved, so Save refused the rule
    // with "Type how many miles". Picking a town now fills a real 50.
    onChange(miles ? { zip_center: p.zip } : { zip_center: p.zip, zip_radius_miles: "50" });
  }

  return (
    <div>
      <Label>{t.circleLabel}</Label>
      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-700">
        <span>{t.takeWithin}</span>
        <Input
          className="w-20"
          inputMode="numeric"
          value={miles}
          onChange={(e) => onChange({ zip_radius_miles: e.target.value.replace(/\D/g, "") })}
          placeholder="50"
          aria-label={t.miles}
        />
        <span>{t.milesOf}</span>
      </div>
      <div className="relative mt-2">
        <Input
          value={text}
          onChange={(e) => type(e.target.value)}
          placeholder={t.townPlaceholder}
          aria-label={t.townAria}
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
        <p className="text-xs text-slate-600 mt-1">{t.circleSays(miles, townName)}</p>
      )}
      {unknownZip && (
        <p className="text-xs text-red-600 mt-1">{t.unknownZip(zipCenter.trim())}</p>
      )}
      {typed.current && text.trim() && !zipCenter && results.length === 0 && text.trim().length >= 2 && (
        <p className="text-xs text-slate-500 mt-1">{t.keepTyping}</p>
      )}
    </div>
  );
}

export function WhereField({
  value,
  onChange,
  lang = "en",
}: {
  value: WhereValue;
  onChange: (patch: Partial<WhereValue>) => void;
  lang?: Lang;
}) {
  const t = ruleText(lang);
  const [showZips, setShowZips] = useState(Boolean(value.zip_codes.trim()));

  const problem = whereProblem(value, lang);
  const anywhere =
    !value.area_codes.length &&
    !value.zip_codes.trim() &&
    !(value.zip_center.trim() && value.zip_radius_miles);

  return (
    <div className="border rounded p-4 space-y-4 bg-slate-50">
      <div>
        <h2 className="font-semibold text-slate-800">{t.whereTitle}</h2>
        <p className="text-xs text-slate-500">{t.whereHelp}</p>
      </div>

      <TownCircle
        zipCenter={value.zip_center}
        miles={value.zip_radius_miles}
        onChange={onChange}
        lang={lang}
      />

      {value.area_codes.length > 0 && (
        <p className="text-xs text-slate-600 bg-white border rounded p-2 flex flex-wrap items-center gap-2">
          <span>{t.areaCodesOld(value.area_codes.join(", "))}</span>
          <button
            type="button"
            onClick={() => onChange({ area_codes: [] })}
            className="underline"
          >
            {t.removeAreaCodes}
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
          {showZips ? t.hideZips : t.showZips}
        </button>
        {showZips && (
          <div className="mt-2">
            <Input
              value={value.zip_codes}
              onChange={(e) => onChange({ zip_codes: e.target.value })}
              placeholder="75201, 752, 76001-76099"
              aria-label={t.zipAria}
            />
            <p className="text-xs text-slate-500 mt-1">{t.zipHelp}</p>
          </div>
        )}
      </div>

      {problem && <p className="text-sm text-red-600">{problem}</p>}
      {anywhere && !problem && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
          {t.anywhere}
        </p>
      )}
    </div>
  );
}

// ---- one-line summary for the rules list ---------------------------------

export function ruleSummary(r: RuleVehicleFields & {
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
  // 2026-11-09: a rule with make cards reads the same way the form does.
  const cards = r.vehicle_wants?.length
    ? describeWants(r.vehicle_categories ?? [], wantsFromRule(r), "en").lines.join("; ")
    : null;
  const where: string[] = [];
  if (r.zip_center && r.zip_radius_miles) where.push(`${r.zip_radius_miles} mi of ${r.zip_center}`);
  if (r.area_codes?.length) where.push(`area ${r.area_codes.join(", ")}`);
  if (r.zip_codes?.length) {
    where.push(`ZIPs ${r.zip_codes.slice(0, 3).join(", ")}${r.zip_codes.length > 3 ? "…" : ""}`);
  }
  const place = where.length ? where.join(" or ") : "anywhere";
  if (cards) return `${cards} · ${place}`;
  return `${types} · ${years} · ${makes} · ${place}`;
}
