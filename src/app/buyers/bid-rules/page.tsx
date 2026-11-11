"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buyerApi } from "@/lib/buyer-api";
import { ruleSummary } from "@/components/buyers/RuleFields";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText } from "@/components/buyers/buyerText";
import { ruleText, serverProblem } from "@/components/buyers/ruleText";

interface BidRule {
  id: number;
  name?: string;
  bid_cents: number;
  active: boolean;
  priority?: number;
  notification_preference?: string[] | null;
  weekly_count_used?: number;
  max_per_week?: number;
  year_min?: number | null;
  year_max?: number | null;
  makes?: string[] | null;
  vehicle_categories?: string[] | null;
  area_codes?: string[] | null;
  zip_codes?: string[] | null;
  zip_center?: string | null;
  zip_radius_miles?: number | null;
}

// Priority and channel names come from the bid-rule form's own table (ruleText).
function priorityLabel(labels: Record<number, string>, p?: number) {
  if (p == null) return "—";
  return labels[p] ?? String(p);
}

export default function BidRulesList() {
  // English or Español, from the switch at the top of the buyer pages (2026-11-10).
  const [lang] = useBuyerLang();
  const t = buyerText(lang).rules;
  const rt = ruleText(lang);
  const [rules, setRules] = useState<BidRule[] | null>(null);
  // Kept as the server's code; turned into words below so it follows the switch.
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      const r = await buyerApi.listRules();
      setRules(r);
    } catch (e: unknown) {
      setErr((e as Error)?.message || "lookup_failed");
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function remove(id: number) {
    if (!confirm(t.confirmDelete)) return;
    try {
      await buyerApi.deleteRule(id);
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message || "delete_failed");
    }
  }

  async function toggleActive(rule: BidRule) {
    try {
      await buyerApi.updateRule(rule.id, { active: !rule.active });
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message || "update_failed");
    }
  }

  async function cloneRule(id: number) {
    try {
      await buyerApi.cloneRule(id);
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message || "clone_failed");
    }
  }

  return (
    <main className="p-6 max-w-5xl mx-auto" lang={lang}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Link href="/buyers/bid-rules/new">
          <Button>{t.newRule}</Button>
        </Link>
      </div>
      {err && <p className="text-red-600 mb-4">{serverProblem(rt, err)}</p>}
      {rules === null ? (
        <p>{rt.loading}</p>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          {t.empty}
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">{t.colName}</th>
                <th className="p-3">{t.colBid}</th>
                <th className="p-3">{t.colActive}</th>
                <th className="p-3">{t.colPriority}</th>
                <th className="p-3">{t.colNotify}</th>
                <th className="p-3">{t.colWeek}</th>
                <th className="p-3">{t.colFilters}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name || t.ruleN(r.id)}</td>
                  <td className="p-3">${(r.bid_cents / 100).toFixed(0)}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(r)}
                      className={`px-3 py-1 rounded border text-xs font-semibold ${
                        r.active
                          ? "bg-brand-600 text-white border-brand-700"
                          : "bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                      aria-pressed={r.active}
                      title={r.active ? t.pauseTitle : t.activateTitle}
                    >
                      {r.active ? t.on : t.off}
                    </button>
                  </td>
                  <td className="p-3 text-slate-700 text-xs">
                    {priorityLabel(rt.priorities, r.priority)}
                  </td>
                  <td className="p-3 text-slate-600 text-xs">
                    {(r.notification_preference ?? []).length
                      ? (r.notification_preference ?? []).map((c) => rt.channelNames[c] ?? c).join(", ")
                      : "—"}
                  </td>
                  <td className="p-3">
                    {r.weekly_count_used ?? 0}
                    {r.max_per_week ? ` / ${r.max_per_week}` : " / ∞"}
                  </td>
                  <td className="p-3 text-slate-600 text-xs">
                    {ruleSummary(r, lang)}
                  </td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    <Link href={`/buyers/bid-rules/${r.id}`} className="text-blue-600 hover:underline">
                      {t.edit}
                    </Link>
                    <button
                      onClick={() => cloneRule(r.id)}
                      className="text-cyan-700 hover:underline"
                      title={t.cloneTitle}
                    >
                      {t.clone}
                    </button>
                    <button
                      onClick={() => remove(r.id)}
                      className="text-red-600 hover:underline"
                    >
                      {t.delete}
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
