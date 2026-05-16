"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";

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

const ageInDays = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d} days ago`;
};

const rankBadge = (offer: Offer) => {
  if (offer.my_rank == null) {
    return <span className="text-xs text-slate-500">Not in queue</span>;
  }
  if (offer.my_status === "won") {
    return <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">You won</span>;
  }
  if (offer.my_status === "declined" || offer.my_status === "expired") {
    return <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">{offer.my_status}</span>;
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
      offer.my_rank === 1 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
    }`}>
      Rank #{offer.my_rank}
      {offer.my_bid_cents != null ? ` · ${fmtMoney(offer.my_bid_cents / 100)}` : ""}
    </span>
  );
};

export default function BuyerMarketplace() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
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
      setErr((e as Error)?.message ?? "Failed to load");
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
    <main className="max-w-5xl mx-auto pt-8 px-4 pb-16">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <Button variant="outline" onClick={() => router.push("/buyers/dashboard")}>
          Dashboard
        </Button>
      </div>
      <p className="text-sm text-slate-600 mb-6">
        Browse active offers. Your queue rank shows where you stand on each — bid rules
        decide which buyers get matched, and rank 1 is currently selected.
      </p>

      <div className="bg-white border rounded p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs">Year ≥</Label>
            <Input type="number" min={1900} max={2030} value={yearMin}
                   onChange={(e) => setYearMin(e.target.value)} placeholder="2010" />
          </div>
          <div>
            <Label className="text-xs">Year ≤</Label>
            <Input type="number" min={1900} max={2030} value={yearMax}
                   onChange={(e) => setYearMax(e.target.value)} placeholder="2024" />
          </div>
          <div>
            <Label className="text-xs">Make</Label>
            <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Honda" />
          </div>
          <div>
            <Label className="text-xs">Condition</Label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}
                    className="w-full h-10 border rounded px-2 text-sm">
              <option value="">Any</option>
              <option value="running">Running</option>
              <option value="non_running">Non-running</option>
              <option value="wrecked">Wrecked</option>
              <option value="parts">Parts only</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">ZIP starts with</Label>
            <Input value={zipPrefix} onChange={(e) => setZipPrefix(e.target.value)} placeholder="731" />
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <Button onClick={load} disabled={loading} className="flex-1">
            {loading ? "Searching…" : "Search"}
          </Button>
          <Button variant="outline" onClick={clear} disabled={loading}>Clear</Button>
        </div>
      </div>

      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm mb-4">
          {err}
        </div>
      )}

      {!loading && offers.length === 0 && (
        <div className="bg-white border rounded p-12 text-center text-slate-500">
          No active offers match your filters right now. Try widening the year range or
          clearing filters.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {offers.map((o) => (
          <div key={o.id} className="bg-white border rounded p-4 hover:border-emerald-300 transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {o.year} {o.make} {o.model}
                </div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">
                  VIN {o.vin || "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-emerald-700">
                  {fmtMoney(o.offer_price)}
                </div>
                <div className="text-[11px] text-slate-500">Offer price</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded capitalize">
                {(o.condition || "unknown").replace(/_/g, " ")}
              </span>
              {o.title_status && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded capitalize">
                  Title: {o.title_status.replace(/_/g, " ")}
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
                {ageInDays(o.created_at)} · {o.queue_depth} buyer{o.queue_depth === 1 ? "" : "s"} in queue
              </div>
              {rankBadge(o)}
            </div>
          </div>
        ))}
      </div>

      {!loading && offers.length > 0 && (
        <p className="text-xs text-slate-500 mt-6 text-center">
          Showing {count} of latest 60 days of active offers. Refine filters or check
          back — new offers post as sellers accept quotes.
        </p>
      )}
    </main>
  );
}
