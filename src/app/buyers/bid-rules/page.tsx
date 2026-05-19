"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buyerApi } from "@/lib/buyer-api";

interface BidRule {
  id: number;
  name?: string;
  bid_cents: number;
  active: boolean;
  priority?: number;
  notification_preference?: string[] | null;
  weekly_count_used?: number;
  max_per_week?: number;
  year_min?: number;
  year_max?: number;
  makes?: string[];
}

const PRIORITY_LABEL: Record<number, string> = {
  0: "Off",
  1: "Low",
  5: "Med",
  10: "High",
};
function priorityLabel(p?: number) {
  if (p == null) return "—";
  return PRIORITY_LABEL[p] ?? String(p);
}

export default function BidRulesList() {
  const [rules, setRules] = useState<BidRule[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      const r = await buyerApi.listRules();
      setRules(r);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "load failed");
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function remove(id: number) {
    if (!confirm("Delete this rule?")) return;
    try {
      await buyerApi.deleteRule(id);
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "delete failed");
    }
  }

  async function toggleActive(rule: BidRule) {
    try {
      await buyerApi.updateRule(rule.id, { active: !rule.active });
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "toggle failed");
    }
  }

  async function cloneRule(id: number) {
    try {
      await buyerApi.cloneRule(id);
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "clone failed");
    }
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Bid Rules</h1>
        <Link href="/buyers/bid-rules/new">
          <Button>+ New rule</Button>
        </Link>
      </div>
      {err && <p className="text-red-600 mb-4">{err}</p>}
      {rules === null ? (
        <p>Loading…</p>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          No bid rules yet. Create one to start receiving matched cars.
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Bid</th>
                <th className="p-3">Active</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Notify</th>
                <th className="p-3">This week</th>
                <th className="p-3">Filters</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name || `Rule ${r.id}`}</td>
                  <td className="p-3">${(r.bid_cents / 100).toFixed(0)}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(r)}
                      className={`px-3 py-1 rounded border text-xs font-semibold ${
                        r.active
                          ? "bg-emerald-600 text-white border-emerald-700"
                          : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                      aria-pressed={r.active}
                      title={r.active ? "Click to pause this rule" : "Click to activate this rule"}
                    >
                      {r.active ? "ON" : "OFF"}
                    </button>
                  </td>
                  <td className="p-3 text-slate-700 text-xs">
                    {priorityLabel(r.priority)}
                  </td>
                  <td className="p-3 text-slate-600 text-xs">
                    {(r.notification_preference ?? []).length
                      ? (r.notification_preference ?? []).join(", ")
                      : "—"}
                  </td>
                  <td className="p-3">
                    {r.weekly_count_used ?? 0}
                    {r.max_per_week ? ` / ${r.max_per_week}` : " / ∞"}
                  </td>
                  <td className="p-3 text-slate-600 text-xs">
                    {r.year_min || "any"}–{r.year_max || "any"} ·{" "}
                    {(r.makes ?? []).join(", ") || "any make"}
                  </td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <Link href={`/buyers/bid-rules/${r.id}`} className="text-blue-600 hover:underline">
                      Edit
                    </Link>
                    <button
                      onClick={() => cloneRule(r.id)}
                      className="text-cyan-700 hover:underline"
                      title="Make a copy of this rule (starts inactive)"
                    >
                      Clone
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
