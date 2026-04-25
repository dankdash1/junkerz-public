"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";

const CONDITIONS = ["runs", "starts_no_drive", "dead", "wrecked"];
const TITLES = ["clean", "salvage", "rebuilt", "no_title"];
const PICKUP_PAYORS = ["buyer", "junkerz", "split"];

interface FormState {
  name: string;
  bid_dollars: string;
  year_min: string;
  year_max: string;
  makes: string;
  conditions: string[];
  title_statuses: string[];
  zip_codes: string;
  weekly_budget_dollars: string;
  pickup_paid_by: string;
  priority: number;
}

export default function NewBidRule() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    bid_dollars: "",
    year_min: "",
    year_max: "",
    makes: "",
    conditions: ["runs"],
    title_statuses: ["clean"],
    zip_codes: "",
    weekly_budget_dollars: "",
    pickup_paid_by: "buyer",
    priority: 0,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const bid_cents = Math.round(parseFloat(form.bid_dollars) * 100);
      if (!Number.isFinite(bid_cents) || bid_cents <= 0) {
        throw new Error("Bid must be a positive dollar amount");
      }
      const payload: Record<string, unknown> = {
        name: form.name || null,
        bid_cents,
        year_min: form.year_min ? parseInt(form.year_min, 10) : null,
        year_max: form.year_max ? parseInt(form.year_max, 10) : null,
        makes: form.makes
          ? form.makes.split(",").map((s: string) => s.trim()).filter(Boolean)
          : null,
        conditions: form.conditions,
        title_statuses: form.title_statuses,
        zip_codes: form.zip_codes
          ? form.zip_codes.split(",").map((s: string) => s.trim()).filter(Boolean)
          : null,
        weekly_budget_cents: form.weekly_budget_dollars
          ? Math.round(parseFloat(form.weekly_budget_dollars) * 100)
          : null,
        pickup_paid_by: form.pickup_paid_by,
        priority: form.priority,
      };
      await buyerApi.createRule(payload);
      router.replace("/buyers/bid-rules");
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "save failed");
    } finally {
      setBusy(false);
    }
  }

  function toggleArray(field: keyof FormState, value: string) {
    setForm((f) => {
      const cur = f[field] as string[];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return { ...f, [field]: next };
    });
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Bid Rule</h1>
      <form onSubmit={save} className="space-y-4 bg-white rounded shadow p-6">
        <div>
          <Label>Name (optional)</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Camry runs in DFW"
          />
        </div>
        <div>
          <Label>Bid amount ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.bid_dollars}
            onChange={(e) => setForm({ ...form, bid_dollars: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Year min</Label>
            <Input
              type="number"
              value={form.year_min}
              onChange={(e) => setForm({ ...form, year_min: e.target.value })}
            />
          </div>
          <div>
            <Label>Year max</Label>
            <Input
              type="number"
              value={form.year_max}
              onChange={(e) => setForm({ ...form, year_max: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Makes (comma separated, blank = any)</Label>
          <Input
            value={form.makes}
            onChange={(e) => setForm({ ...form, makes: e.target.value })}
            placeholder="Honda, Toyota"
          />
        </div>
        <div>
          <Label>Conditions</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CONDITIONS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggleArray("conditions", c)}
                className={`px-3 py-1 rounded border text-sm ${
                  form.conditions.includes(c)
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-white text-slate-700"
                }`}
              >
                {c.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Title statuses</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {TITLES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => toggleArray("title_statuses", t)}
                className={`px-3 py-1 rounded border text-sm ${
                  form.title_statuses.includes(t)
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-white text-slate-700"
                }`}
              >
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Zip codes (comma separated, blank = any)</Label>
          <Input
            value={form.zip_codes}
            onChange={(e) => setForm({ ...form, zip_codes: e.target.value })}
            placeholder="75201, 75202"
          />
        </div>
        <div>
          <Label>Weekly budget ($, blank = unlimited)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.weekly_budget_dollars}
            onChange={(e) =>
              setForm({ ...form, weekly_budget_dollars: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Who pays pickup</Label>
          <div className="flex gap-2 mt-1">
            {PICKUP_PAYORS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setForm({ ...form, pickup_paid_by: p })}
                className={`px-3 py-1 rounded border text-sm ${
                  form.pickup_paid_by === p
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-white text-slate-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={busy} className="flex-1">
            {busy ? "Saving…" : "Save rule"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.replace("/buyers/bid-rules")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
