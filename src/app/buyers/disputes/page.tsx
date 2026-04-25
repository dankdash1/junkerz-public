"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";

const REASONS = [
  "not_as_described",
  "title_problem",
  "not_delivered",
  "damaged_in_transport",
  "wrong_vehicle",
];

export default function Disputes() {
  const [list, setList] = useState<any[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function reload() {
    try {
      setErr(null);
      const r = await buyerApi.listDisputes();
      setList(r);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "load failed");
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
      if (!Number.isFinite(mid) || mid <= 0) throw new Error("Invalid match ID");
      await buyerApi.openDispute({ match_id: mid, reason, description });
      setShowForm(false);
      setMatchId("");
      setDescription("");
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "submit failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Disputes</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Open dispute"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white rounded shadow p-6 mb-6 space-y-4"
        >
          <div>
            <Label>Match ID</Label>
            <Input
              type="number"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              Find the match ID on the Won Cars page.
            </p>
          </div>
          <div>
            <Label>Reason</Label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border rounded p-2 w-full"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Description (optional)</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border rounded p-2 w-full min-h-24"
            />
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <Button type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit dispute"}
          </Button>
        </form>
      )}

      {err && !showForm && <p className="text-red-600 mb-4">{err}</p>}

      {list === null ? (
        <p>Loading…</p>
      ) : list.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          No disputes yet.
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Match</th>
                <th className="p-3">Reason</th>
                <th className="p-3">Status</th>
                <th className="p-3">Resolved</th>
                <th className="p-3">When</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="p-3">{d.match_id}</td>
                  <td className="p-3 capitalize">{d.reason.replace(/_/g, " ")}</td>
                  <td className="p-3 capitalize">{d.status.replace(/_/g, " ")}</td>
                  <td className="p-3">
                    {d.resolved_amount_cents != null
                      ? `$${(d.resolved_amount_cents / 100).toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="p-3 text-xs text-slate-600 whitespace-nowrap">
                    {new Date(d.created_at).toLocaleString()}
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
