"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText, serverWords, type BuyerText } from "@/components/buyers/buyerText";
import { ruleText } from "@/components/buyers/ruleText";

type Offer = {
  id: number;
  vin: string;
  year: number;
  make: string;
  model: string;
  condition: string;
  offer_price: number;
  zip_code: string;
  title_status: string;
  status: string;
  created_at: string;
  queue_depth: number;
  my_rank: number | null;
  my_status: string | null;
  my_bid_cents: number | null;
};

const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

// English or Español, from the switch at the top of the buyer pages (2026-11-10).
type MarketText = BuyerText["market"];

const ageInDays = (iso: string, t: MarketText) => {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (d === 0) return t.today;
  if (d === 1) return t.yesterday;
  return t.daysAgo(d);
};

const rankBadge = (offer: Offer, t: MarketText) => {
  if (offer.my_rank == null) {
    return <span className="text-xs text-slate-500">{t.notInQueue}</span>;
  }
  if (offer.my_status === "won") {
    return <span className="text-xs px-2 py-0.5 rounded bg-brand-100 text-brand-800 font-medium">{t.youWon}</span>;
  }
  if (offer.my_status === "declined" || offer.my_status === "expired") {
    return <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">{t.myStatuses[offer.my_status] ?? offer.my_status}</span>;
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
      offer.my_rank === 1 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
    }`}>
      {t.rank(offer.my_rank)}
      {offer.my_bid_cents != null ? ` · ${fmtMoney(offer.my_bid_cents / 100)}` : ""}
    </span>
  );
};

export default function BuyerMarketplace() {
  const router = useRouter();
  const [lang] = useBuyerLang();
  const T = buyerText(lang);
  const t = T.market;
  const rt = ruleText(lang);
  // Condition / title values from the server, in words; unknown ones as written.
  const valueWords = (v: string) =>
    t.conditions[v] ?? rt.conditionNames[v] ?? rt.titleNames[v] ?? v.replace(/_/g, " ");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  // Kept as the server's code; turned into words below so it follows the switch.
  const [err, setErr] = useState<string | null>(null);

  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [make, setMake] = useState("");
  const [condition, setCondition] = useState("");
  const [zipPrefix, setZipPrefix] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && !window.localStorage.getItem("buyer_token")) {
      router.replace("/buyers/login");
    }
  }, [router]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const filters = {
        year_min: yearMin ? Number(yearMin) : undefined,
        year_max: yearMax ? Number(yearMax) : undefined,
        make: make.trim() || undefined,
        condition: condition.trim() || undefined,
        zip_prefix: zipPrefix.trim() || undefined,
      };
      const r = await buyerApi.marketplace(filters);
      setOffers(r.offers || []);
      setCount(r.count || 0);
    } catch (e: unknown) {
      setErr((e as Error)?.message || "lookup_failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line */ }, []);

  const clear = () => {
    setYearMin(""); setYearMax(""); setMake(""); setCondition(""); setZipPrefix("");
    setTimeout(load, 0);
  };

  return (
    <main className="max-w-5xl mx-auto pt-8 px-4 pb-16" lang={lang}>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Button variant="outline" onClick={() => router.push("/buyers/dashboard")}>
          {t.dashboard}
        </Button>
      </div>
      <p className="text-sm text-slate-600 mb-6">{t.intro}</p>

      <div className="bg-white border rounded p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">{t.yearMin}</Label>
            <Input type="number" min={1900} max={2030} value={yearMin}
                   onChange={(e) => setYearMin(e.target.value)} placeholder="2010" />
          </div>
          <div>
            <Label className="text-xs">{t.yearMax}</Label>
            <Input type="number" min={1900} max={2030} value={yearMax}
                   onChange={(e) => setYearMax(e.target.value)} placeholder="2024" />
          </div>
          <div>
            <Label className="text-xs">{t.make}</Label>
            <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Honda" />
          </div>
          <div>
            <Label className="text-xs">{t.condition}</Label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-10 border rounded px-2 text-sm">
              <option value="">{t.any}</option>
              <option value="running">{t.conditions.running}</option>
              <option value="non_running">{t.conditions.non_running}</option>
              <option value="wrecked">{t.conditions.wrecked}</option>
              <option value="parts">{t.conditions.parts}</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">{t.zip}</Label>
            <Input value={zipPrefix} onChange={(e) => setZipPrefix(e.target.value)} placeholder="731" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={load} disabled={loading} className="flex-1">
            {loading ? t.searching : t.search}
          </Button>
          <Button variant="outline" onClick={clear} disabled={loading}>{t.clear}</Button>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm mb-4">
          {serverWords(T, {}, err)}
        </div>
      )}

      {!loading && offers.length === 0 && (
        <div className="bg-white border rounded p-12 text-center text-slate-500">
          {t.empty}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {offers.map((o) => (
          <div key={o.id} className="bg-white border rounded p-4 hover:border-brand-300 transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {o.year} {o.make} {o.model}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  {t.vin} {o.vin || "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-brand-700">
                  {fmtMoney(o.offer_price)}
                </div>
                <div className="text-[11px] text-slate-500">{t.offerPrice}</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded capitalize">
                {o.condition ? valueWords(o.condition) : t.unknown}
              </span>
              {o.title_status && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded capitalize">
                  {t.titleChip(valueWords(o.title_status))}
                </span>
              )}
              {o.zip_code && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                  ZIP {o.zip_code}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="text-xs text-slate-500">
                {ageInDays(o.created_at, t)} · {t.queue(o.queue_depth)}
              </div>
              {rankBadge(o, t)}
            </div>
          </div>
        ))}
      </div>

      {!loading && offers.length > 0 && (
        <p className="text-xs text-slate-500 mt-6 text-center">
          {t.showing(count)}
        </p>
      )}
    </main>
  );
}
