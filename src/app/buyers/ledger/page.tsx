"use client";
import { useEffect, useState } from "react";
import { buyerApi } from "@/lib/buyer-api";

export default function Ledger() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    buyerApi
      .ledger()
      .then(setRows)
      .catch((e) => setErr((e as Error)?.message ?? "load failed"));
  }, []);

  if (err) return <main className="p-12 text-red-600">{err}</main>;

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ledger</h1>
      {rows === null ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          No ledger entries yet.
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Balance</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="p-3 capitalize">{r.entry_type.replace(/_/g, " ")}</td>
                  <td
                    className={`p-3 text-right ${
                      r.amount_cents > 0 ? "text-red-700" : "text-emerald-700"
                    }`}
                  >
                    ${(r.amount_cents / 100).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    ${(r.balance_after_cents / 100).toFixed(2)}
                  </td>
                  <td className="p-3 text-xs text-slate-600">{r.notes || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
