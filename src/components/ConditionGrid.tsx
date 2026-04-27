"use client";
import { Label } from "@/components/ui/label";

export type DamageZones = Record<string, "none" | "some">;

const ZONES: { key: string; label: string }[] = [
  { key: "front", label: "Front" },
  { key: "rear", label: "Rear" },
  { key: "left", label: "Left side" },
  { key: "right", label: "Right side" },
  { key: "engine_bay", label: "Engine bay" },
  { key: "glass", label: "Glass" },
  { key: "airbags_deployed", label: "Airbags" },
  { key: "flood", label: "Flood" },
  { key: "fire", label: "Fire" },
];

type Props = {
  value: DamageZones;
  onChange: (v: DamageZones) => void;
};

export default function ConditionGrid({ value, onChange }: Props) {
  function toggle(key: string) {
    const cur = value[key] === "some" ? "none" : "some";
    onChange({ ...value, [key]: cur });
  }
  return (
    <div>
      <Label>Damage (tap any with damage)</Label>
      <div className="grid grid-cols-3 gap-2 mt-2">
        {ZONES.map((z) => {
          const damaged = value[z.key] === "some";
          return (
            <button
              key={z.key}
              type="button"
              onClick={() => toggle(z.key)}
              className={`p-3 rounded border text-sm ${
                damaged
                  ? "bg-rose-600 text-white border-rose-700"
                  : "bg-white text-slate-700"
              }`}
            >{z.label}</button>
          );
        })}
      </div>
    </div>
  );
}
