"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";

interface BidRule {
  id: number;
  name?: string;
  bid_cents: number;
  active: boolean;
}

interface BacktestResult {
  window_days: number;
  matched_offers: number;
  total_spend_cents: number;
}

export default function EditBidRule() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const [rule, setRule] = useState<BidRule | null>(null);
  const [bidDollars, setBidDollars] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [backtest, setBacktest] = useState<BacktestResult | null>(null);

  useEffect(() => {
    buyerApi
      .getRule(id)
      .then((r: BidRule) => {
        setRule(r);
        setBidDollars(((r.bid_cents ?? 0) / 100).toFixed(2));
        setActive(!!r.active);
      })
      .catch((e: Error) => setErr(e?.message ?? "load failed"));
  }, [id]);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const bid_cents = Math.round(parseFloat(bidDollars) * 100);
      if (!Number.isFinite(bid_cents) || bid_cents <= 0) {
        throw new Error("Bid must be a positive dollar amount");
      }
      await buyerApi.updateRule(id, { bid_cents, active });
      router.replace("/buyers/bid-rules");
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function runBacktest() {
    setBusy(true);
    try {
      const r = await buyerApi.testRule(id);
      setBacktest(r);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "backtest failed");
    } finally {
      setBusy(false);
    }
  }

  if (err && !rule) return <main className="p-12 text-red-600">{err}</main>;
  if (!rule) return <main className="p-12">Loading…</main>;

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Bid Rule</h1>
      <div className="bg-white rounded shadow p-6 space-y-4">
        <div>
          <Label>Name</Label>
          <p className="text-slate-700">{rule.name || `Rule ${rule.id}`}</p>
        </div>
        <div>
          <Label>Bid ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={bidDollars}
            onChange={(e) => setBidDollars(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          <label htmlFor="active">Active</label>
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2 pt-2">
          <Button onClick={save} disabled={busy} className="flex-1">
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={runBacktest} disabled={busy}>
            Backtest
          </Button>
        </div>
      </div>

      {backtest && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Backtest</h2>
          <p className="text-slate-700">
            In the last {backtest.window_days} days, this rule would have matched{" "}
            <strong>{backtest.matched_offers}</strong> offers, total spend{" "}
            <strong>${(backtest.total_spend_cents / 100).toFixed(0)}</strong>.
          </p>
        </div>
      )}
    </main>
  );
}
