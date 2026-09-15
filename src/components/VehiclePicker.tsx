"use client";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

export type VehicleSelection = {
  year: number | null;
  make_id: number | null;
  make_name: string | null;
  model_id: number | null;
  model_name: string | null;
  trim: string;
};

type Props = {
  value: VehicleSelection;
  onChange: (v: VehicleSelection) => void;
  showTrim?: boolean;
  // PR-J5.5c Phase 4: cascading filter from outer form.
  // When provided, the Make list is filtered to manufacturers that build
  // at least one model in any of `categories` within [yearMin, yearMax].
  // The inner Year dropdown is still used to fetch Models for the chosen Make.
  categories?: string[];
  yearMin?: number | null;
  yearMax?: number | null;
  // Buyer bid rules: pick a make on its own, add a year only to list models.
  // The seller quote form keeps year first.
  makeFirst?: boolean;
};

export default function VehiclePicker({
  value,
  onChange,
  showTrim = true,
  categories,
  yearMin,
  yearMax,
  makeFirst = false,
}: Props) {
  const [years, setYears] = useState<number[]>([]);
  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);
  const [models, setModels] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/junkerz/vehicles/years`)
      .then((r) => r.json())
      .then((j) => setYears(j.years || []))
      .catch(() => setYears([]));
  }, []);

  const catKey = (categories ?? []).join(",");
  useEffect(() => {
    const params = new URLSearchParams();
    if (catKey) params.set("categories", catKey);
    if (yearMin != null) params.set("year_min", String(yearMin));
    if (yearMax != null) params.set("year_max", String(yearMax));
    const url = `${API_BASE}/api/junkerz/vehicles/makes/by-category${
      params.toString() ? `?${params}` : ""
    }`;
    fetch(url)
      .then((r) => r.json())
      .then((j) => setMakes(j.makes || []))
      .catch(() => setMakes([]));
  }, [catKey, yearMin, yearMax]);

  useEffect(() => {
    if (!value.year || !value.make_id) { setModels([]); return; }
    fetch(`${API_BASE}/api/junkerz/vehicles/models?year=${value.year}&make_id=${value.make_id}`)
      .then((r) => r.json())
      .then((j) => setModels(j.models || []))
      .catch(() => setModels([]));
  }, [value.year, value.make_id]);

  const yearBlock = (
    <div>
      <Label>Year{makeFirst ? " (optional, to list models)" : ""}</Label>
      <select
        className="w-full border rounded h-10 px-2"
        value={value.year ?? ""}
        onChange={(e) => {
          const year = e.target.value ? parseInt(e.target.value, 10) : null;
          onChange(
            makeFirst
              ? { ...value, year, model_id: null, model_name: null }
              : { ...value, year, make_id: null, make_name: null, model_id: null, model_name: null },
          );
        }}
      >
        <option value="">{makeFirst ? "Any year" : "Select year"}</option>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );

  const makeBlock = (
    <div>
      <Label>Make</Label>
      <select
        className="w-full border rounded h-10 px-2"
        value={value.make_id ?? ""}
        disabled={!makeFirst && !value.year}
        onChange={(e) => {
          const id = e.target.value ? parseInt(e.target.value, 10) : null;
          const name = makes.find((m) => m.id === id)?.name ?? null;
          onChange({ ...value, make_id: id, make_name: name,
                     model_id: null, model_name: null });
        }}
      >
        <option value="">
          {makeFirst || value.year ? "Select make" : "Pick a year first"}
        </option>
        {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    </div>
  );

  const modelHint = !value.make_id
    ? "Pick a make first"
    : !value.year
      ? "Pick a year to list models"
      : "Select model";

  const modelBlock = (
    <div>
      <Label>Model</Label>
      <select
        className="w-full border rounded h-10 px-2"
        value={value.model_id ?? ""}
        disabled={!value.make_id || !value.year}
        onChange={(e) => {
          const id = e.target.value ? parseInt(e.target.value, 10) : null;
          const name = models.find((m) => m.id === id)?.name ?? null;
          onChange({ ...value, model_id: id, model_name: name });
        }}
      >
        <option value="">{modelHint}</option>
        {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-3">
      {makeFirst ? (
        <>
          {makeBlock}
          {yearBlock}
          {modelBlock}
        </>
      ) : (
        <>
          {yearBlock}
          {makeBlock}
          {modelBlock}
        </>
      )}

      {showTrim && (
        <div>
          <Label>Trim (optional)</Label>
          <input
            className="w-full border rounded h-10 px-2"
            value={value.trim}
            onChange={(e) => onChange({ ...value, trim: e.target.value })}
            placeholder="e.g., LE, SE, Sport"
          />
        </div>
      )}
    </div>
  );
}
