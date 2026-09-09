"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

type Opt = { id: number; name: string };

const selectCls =
  "h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[15px] font-medium " +
  "text-zinc-900 outline-none transition focus:border-brand-600 focus:ring-2 " +
  "focus:ring-brand-600/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

/**
 * The first step of the quote, lifted onto the homepage.
 * It collects year, make and model, then hands them to the wizard
 * so the seller never re-types what they already told us.
 */
type Copy = {
  lead: string; year: string; make: string; model: string;
  pickYear: string; pickMake: string; cta: string; going: string; note: string;
};

const EN: Copy = {
  lead: "Start with your car. Takes about a minute.",
  year: "Year", make: "Make", model: "Model",
  pickYear: "Pick a year first", pickMake: "Pick a make first",
  cta: "See what it's worth", going: "One second…",
  note: "No account. No obligation. We never sell your details.",
};

export const ES: Copy = {
  lead: "Empiece con su carro. Toma como un minuto.",
  year: "Año", make: "Marca", model: "Modelo",
  pickYear: "Elija el año primero", pickMake: "Elija la marca primero",
  cta: "Ver cuánto vale", going: "Un momento…",
  note: "Sin cuenta. Sin compromiso. Nunca vendemos sus datos.",
};

export default function HeroQuoteForm({ copy = EN }: { copy?: Copy }) {
  const router = useRouter();
  const [years, setYears] = useState<number[]>([]);
  const [makes, setMakes] = useState<Opt[]>([]);
  const [models, setModels] = useState<Opt[]>([]);

  const [year, setYear] = useState<string>("");
  const [make, setMake] = useState<Opt | null>(null);
  const [model, setModel] = useState<Opt | null>(null);
  const [going, setGoing] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/junkerz/vehicles/years`)
      .then((r) => r.json())
      .then((j) => setYears(j.years || []))
      .catch(() => setYears([]));
    fetch(`${API_BASE}/api/junkerz/vehicles/makes/by-category`)
      .then((r) => r.json())
      .then((j) => setMakes(j.makes || []))
      .catch(() => setMakes([]));
  }, []);

  useEffect(() => {
    if (!year || !make) { setModels([]); setModel(null); return; }
    fetch(`${API_BASE}/api/junkerz/vehicles/models?year=${year}&make_id=${make.id}`)
      .then((r) => r.json())
      .then((j) => setModels(j.models || []))
      .catch(() => setModels([]));
  }, [year, make]);

  const ready = !!(year && make && model);

  function go() {
    if (!ready) return;
    setGoing(true);
    const p = new URLSearchParams({
      year: String(year),
      make_id: String(make!.id),
      make: make!.name,
      model_id: String(model!.id),
      model: model!.name,
    });
    router.push(`/quote?${p.toString()}`);
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-[0_20px_60px_-15px_rgba(16,24,28,.25)] sm:p-6">
      <p className="text-center text-[15px] font-bold text-zinc-900">
        {copy.lead}
      </p>
      <div className="mt-4 grid gap-3">
        <select
          aria-label="Vehicle year"
          className={selectCls}
          value={year}
          onChange={(e) => { setYear(e.target.value); setModel(null); }}
        >
          <option value="">{copy.year}</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <select
          aria-label="Vehicle make"
          className={selectCls}
          disabled={!year}
          value={make?.id ?? ""}
          onChange={(e) => {
            const m = makes.find((x) => String(x.id) === e.target.value) || null;
            setMake(m); setModel(null);
          }}
        >
          <option value="">{year ? copy.make : copy.pickYear}</option>
          {makes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <select
          aria-label="Vehicle model"
          className={selectCls}
          disabled={!make || models.length === 0}
          value={model?.id ?? ""}
          onChange={(e) =>
            setModel(models.find((x) => String(x.id) === e.target.value) || null)
          }
        >
          <option value="">{make ? copy.model : copy.pickMake}</option>
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>

        <Button
          onClick={go}
          disabled={!ready || going}
          className="h-14 w-full gap-2 text-base font-bold"
        >
          {going ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {going ? copy.going : copy.cta}
          {!going && <ArrowRight className="h-5 w-5" />}
        </Button>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        {copy.note}
      </p>
    </div>
  );
}
