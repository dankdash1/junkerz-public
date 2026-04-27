"use client";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://api.dankdash.ai";

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
};

export default function VehiclePicker({ value, onChange, showTrim = true }: Props) {
  const [years, setYears] = useState<number[]>([]);
  const [makes, setMakes] = useState<{ id: number; name: string }[]>([]);
  const [models, setModels] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/junkerz/vehicles/years`)
      .then((r) => r.json())
      .then((j) => setYears(j.years || []))
      .catch(() => setYears([]));
  }, []);

  useEffect(() => {
    if (!value.year) { setMakes([]); return; }
    fetch(`${API_BASE}/api/junkerz/vehicles/makes?year=${value.year}`)
      .then((r) => r.json())
      .then((j) => setMakes(j.makes || []))
      .catch(() => setMakes([]));
  }, [value.year]);

  useEffect(() => {
    if (!value.year || !value.make_id) { setModels([]); return; }
    fetch(`${API_BASE}/api/junkerz/vehicles/models?year=${value.year}&make_id=${value.make_id}`)
      .then((r) => r.json())
      .then((j) => setModels(j.models || []))
      .catch(() => setModels([]));
  }, [value.year, value.make_id]);

  return (
    <div className="space-y-3">
      <div>
        <Label>Year</Label>
        <select
          className="w-full border rounded h-10 px-2"
          value={value.year ?? ""}
          onChange={(e) => onChange({
            ...value,
            year: e.target.value ? parseInt(e.target.value, 10) : null,
            make_id: null, make_name: null,
            model_id: null, model_name: null,
          })}
        >
          <option value="">Select year</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div>
        <Label>Make</Label>
        <select
          className="w-full border rounded h-10 px-2"
          value={value.make_id ?? ""}
          disabled={!value.year}
          onChange={(e) => {
            const id = e.target.value ? parseInt(e.target.value, 10) : null;
            const name = makes.find((m) => m.id === id)?.name ?? null;
            onChange({ ...value, make_id: id, make_name: name,
                       model_id: null, model_name: null });
          }}
        >
          <option value="">{value.year ? "Select make" : "Pick a year first"}</option>
          {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div>
        <Label>Model</Label>
        <select
          className="w-full border rounded h-10 px-2"
          value={value.model_id ?? ""}
          disabled={!value.make_id}
          onChange={(e) => {
            const id = e.target.value ? parseInt(e.target.value, 10) : null;
            const name = models.find((m) => m.id === id)?.name ?? null;
            onChange({ ...value, model_id: id, model_name: name });
          }}
        >
          <option value="">{value.make_id ? "Select model" : "Pick a make first"}</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

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
