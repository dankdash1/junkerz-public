"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText, serverWords } from "@/components/buyers/buyerText";

const REASONS = [
  "not_as_described",
  "title_problem",
  "not_delivered",
  "damaged_in_transport",
  "wrong_vehicle",
];

export default function Disputes() {
  // English or Español, from the switch at the top of the buyer pages (2026-11-10).
  const [lang] = useBuyerLang();
  const T = buyerText(lang);
  const t = T.disputes;
  const words = (code: string, table: Record<string, string>) => table[code] ?? code.replace(/_/g, " ");
  const [list, setList] = useState<any[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  // Kept as the server's code; turned into words below so it follows the switch.
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      setErr(null);
      const r = await buyerApi.listDisputes();
      setList(r);
    } catch (e: unknown) {
      setErr((e as Error)?.message || "lookup_failed");
    }
  }

  useEffect(() => {
    reload();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const mid = parseInt(matchId, 10);
      if (!Number.isFinite(mid) || mid <= 0) throw new Error("invalid_match");
      await buyerApi.openDispute({ match_id: mid, reason, description });
      setShowForm(false);
      setMatchId("");
      setDescription("");
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message || "insert_failed");
    } finally {
      setBusy(false);
    }
  }

  const errText = err ? serverWords(T, t.server, err) : null;

  return (
    <main className="p-6 max-w-4xl mx-auto" lang={lang}>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t.cancel : t.open}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white rounded shadow p-6 mb-6 space-y-4"
        >
          <div>
            <Label>{t.matchId}</Label>
            <Input
              type="number"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {t.matchHelp}
            </p>
          </div>
          <div>
            <Label>{t.reason}</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border rounded p-2 w-full"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {words(r, t.reasons)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>{t.description}</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded p-2 w-full min-h-24"
            />
          </div>
          {errText && <p className="text-red-600 text-sm">{errText}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? t.submitting : t.submit}
          </Button>
        </form>
      )}

      {errText && !showForm && <p className="text-red-600 mb-4">{errText}</p>}

      {list === null ? (
        <p>{T.loading}</p>
      ) : list.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          {t.empty}
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">{t.colMatch}</th>
                <th className="p-3">{t.colReason}</th>
                <th className="p-3">{t.colStatus}</th>
                <th className="p-3">{t.colResolved}</th>
                <th className="p-3">{t.colWhen}</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.match_id}</td>
                  <td className="p-3 capitalize">{words(d.reason, t.reasons)}</td>
                  <td className="p-3 capitalize">{words(d.status, t.statuses)}</td>
                  <td className="p-3">
                    {d.resolved_amount_cents != null
                      ? `$${(d.resolved_amount_cents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="p-3 text-xs text-slate-600 whitespace-nowrap">
                    {new Date(d.created_at).toLocaleString(lang === "es" ? "es-MX" : undefined)}
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
