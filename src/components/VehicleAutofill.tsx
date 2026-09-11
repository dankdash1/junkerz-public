"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";
const STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR".split(" ");
export type LookedUpVehicle = { vin: string; year: number; make: string; model: string; trim: string };

export default function VehicleAutofill({ onResolved, lang = "en", revision = 0 }: {
  onResolved: (vehicle: LookedUpVehicle, token: string) => void; lang?: "en" | "es";
  revision?: number;
}) {
  const [config, setConfig] = useState<{ enabled: boolean; plate_available: boolean } | null>(null);
  const [mode, setMode] = useState<"vin" | "plate">("vin");
  const [value, setValue] = useState("");
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const active = useRef<AbortController | null>(null);
  const es = lang === "es";
  useEffect(() => { active.current?.abort(); setBusy(false); setMessage(""); }, [revision]);
  useEffect(() => {
    let mounted = true;
    const load = () => fetch(`${BASE}/api/public/junkerz/vehicle-lookup/config`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : null).then(c => { if (mounted) setConfig(c); })
      .catch(() => { if (mounted) setConfig(null); });
    load();
    window.addEventListener("focus", load);
    return () => { mounted = false; active.current?.abort(); window.removeEventListener("focus", load); };
  }, []);

  const cancel = () => { active.current?.abort(); setBusy(false); setMessage(""); };
  async function lookup() {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true); setMessage("");
    try {
      const r = await fetch(`${BASE}/api/public/junkerz/vehicle-lookup`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify(mode === "vin" ? { vin: value.trim() } : { plate: value.trim(), state }),
      });
      const data = await r.json();
      if (controller.signal.aborted) return;
      if (!r.ok || data.status !== "ok") {
        setMessage(es ? "No pudimos encontrar el vehículo. Revise los datos o complete el formulario abajo." :
          "We couldn’t find your vehicle. Check the details or enter them below.");
        return;
      }
      onResolved(data.vehicle, data.vehicle_lookup_token);
      setMessage(es ? "Encontramos su vehículo. Confirme los datos abajo." : "Vehicle found. Confirm the details below.");
    } catch {
      if (!controller.signal.aborted) setMessage(es ? "La búsqueda no está disponible. Puede continuar abajo." :
        "Lookup is unavailable right now. You can still enter your vehicle below.");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  if (!config?.enabled) return null;
  const valid = mode === "vin" ? /^[A-HJ-NPR-Z0-9]{17}$/i.test(value.trim()) : !!state && /^[A-Z0-9 -]{1,10}$/i.test(value.trim());
  return <section aria-label={es ? "Buscar vehículo" : "Find your vehicle"} className="rounded-xl border border-brand-200 bg-brand-50/50 p-4">
    <h2 className="font-bold text-zinc-900">{es ? "Encuentre su vehículo más rápido" : "Find your vehicle faster"}</h2>
    <p className="mt-1 text-sm text-zinc-600">{es ? "Complete los datos automáticamente o escríbalos abajo." : "Fill in your vehicle details automatically, or enter them below."}</p>
    <div className="mt-3 flex gap-2">
      {(["vin", "plate"] as const).map(m => <button key={m} type="button" aria-pressed={mode === m}
        disabled={m === "plate" && !config.plate_available}
        onClick={() => { cancel(); setMode(m); setValue(""); }}
        className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40 ${mode === m ? "bg-brand-600 text-white border-brand-600" : "bg-white border-zinc-200"}`}>
        {m === "vin" ? "VIN" : es ? "Placa" : "License plate"}</button>)}
    </div>
    {!config.plate_available && <p className="mt-2 text-xs text-zinc-500">{es ? "La búsqueda por placa estará disponible pronto. Use su VIN o continúe abajo." : "Plate lookup is coming soon. Use your VIN or continue below."}</p>}
    <div className="mt-3 flex gap-2">
      <label className="min-w-0 flex-1 text-sm font-medium">{mode === "vin" ? "VIN" : es ? "Número de placa" : "Plate number"}
        <input value={value} maxLength={mode === "vin" ? 17 : 10} autoCapitalize="characters" autoCorrect="off" spellCheck={false}
          onChange={e => { cancel(); setValue(e.target.value.toUpperCase()); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (valid && !busy) lookup(); } }}
          placeholder={mode === "vin" ? (es ? "17 caracteres" : "17 characters") : "ABC1234"}
          className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 font-mono" /></label>
      {mode === "plate" && <label className="text-sm font-medium">{es ? "Estado" : "State"}
        <select value={state} onChange={e => { cancel(); setState(e.target.value); }} className="mt-1 block h-11 rounded-lg border border-zinc-300 bg-white px-2">
          <option value="">{es ? "Elegir" : "Select"}</option>{STATES.map(s => <option key={s}>{s}</option>)}
        </select></label>}
    </div>
    <button type="button" onClick={lookup} disabled={!valid || busy} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 font-semibold text-white disabled:opacity-40">
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
      {busy ? (es ? "Buscando…" : "Finding vehicle…") : (es ? "Buscar mi vehículo" : "Find my vehicle")}
    </button>
    <p role="status" className="mt-2 text-sm text-zinc-700">{message}</p>
  </section>;
}
