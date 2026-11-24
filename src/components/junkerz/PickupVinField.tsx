"use client";
import { useState } from "react";
import { normalizeVin, pickupVinError, vinLooksValid, vinWarningLines, VIN_SHAPE_MESSAGE } from "@/lib/pickup-vin";
import VinCheckNote from "@/components/junkerz/VinCheckNote";

/**
 * VIN shown on the buyer won-car page and the driver pickup page.
 * Missing: an input + Save. Present and unsigned: an "Edit" link.
 * Signed: read-only (the signed bill of sale must never change).
 */
export default function PickupVinField({ vin, year, signed, disabled, onSave }: {
  vin: string | null | undefined;
  /** Listed model year, for the VIN year check (a warning only). */
  year?: number | string | null;
  signed: boolean;
  disabled?: boolean;
  onSave: (vin: string) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const open = !signed && (!vin || editing);
  // George 2026-11-23: check digit / model year is a warning, never a block.
  const warned = vinWarningLines(value, year).length > 0;

  const save = async () => {
    const next = normalizeVin(value);
    if (!vinLooksValid(next)) { setError(VIN_SHAPE_MESSAGE); return; }
    setBusy(true); setError(null);
    try {
      await onSave(next);
      setEditing(false); setValue("");
    } catch (e) {
      setError(pickupVinError((e as Error)?.message));
    } finally {
      setBusy(false);
    }
  };

  return <section aria-label="VIN" className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
    <div className="flex items-center justify-between gap-3">
      <p><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">VIN</span>{" "}
        <span className="font-mono">{vin || "Not recorded"}</span></p>
      {vin && !signed && !editing && <button type="button" className="text-sm font-semibold underline" onClick={() => { setEditing(true); setValue(vin); setError(null); }}>Edit</button>}
    </div>
    {open && <div className="mt-3 space-y-2">
      <label className="block text-sm font-medium" htmlFor="pickup-vin-input">{vin ? "Correct the VIN" : "Type the VIN"}</label>
      <input id="pickup-vin-input" className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono text-base uppercase text-slate-950 focus:border-slate-950 focus:outline-none"
        value={value} maxLength={20} autoCapitalize="characters" autoComplete="off" spellCheck={false}
        onChange={e => { setValue(e.target.value.toUpperCase()); setError(null); }} disabled={busy || disabled}/>
      <p className="text-xs text-slate-500">Read it from the dashboard or the driver&apos;s door; also take the VIN plate photo.</p>
      <VinCheckNote vin={value} year={year}/>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button type="button" className="min-h-11 rounded-lg bg-slate-950 px-4 font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500"
          disabled={busy || disabled || !value.trim()} onClick={() => void save()}>{busy ? "Saving…" : warned ? "Save anyway" : "Save VIN"}</button>
        {editing && <button type="button" className="min-h-11 rounded-lg px-4 font-semibold ring-1 ring-slate-300" disabled={busy} onClick={() => { setEditing(false); setError(null); }}>Cancel</button>}
      </div>
    </div>}
  </section>;
}
