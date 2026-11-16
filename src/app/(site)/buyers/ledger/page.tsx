"use client";
import { useEffect, useState } from "react";
import { buyerApi } from "@/lib/buyer-api";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText, serverWords } from "@/components/buyers/buyerText";

export default function Ledger() {
  // English or Español, from the switch at the top of the buyer pages (2026-11-10).
  const [lang] = useBuyerLang();
  const T = buyerText(lang);
  const t = T.ledger;
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    buyerApi
      .ledger()
      .then(setRows)
      .catch((e) => setErr((e as Error)?.message || "lookup_failed"));
  }, []);

  if (err) return <main className="p-12 text-red-600" lang={lang}>{serverWords(T, {}, err)}</main>;

  return (
    <main className="p-6 max-w-5xl mx-auto" lang={lang}>
      <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
      {rows === null ? (
        <p>{T.loading}</p>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          {t.empty}
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">{t.colDate}</th>
                <th className="p-3">{t.colType}</th>
                <th className="p-3 text-right">{t.colAmount}</th>
                <th className="p-3 text-right">{t.colBalance}</th>
                <th className="p-3">{t.colNotes}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString(lang === "es" ? "es-MX" : undefined)}
                  </td>
                  <td className="p-3 capitalize">{t.types[r.entry_type] ?? r.entry_type.replace(/_/g, " ")}</td>
                  <td
                    className={`p-3 text-right ${
                      r.amount_cents > 0 ? "text-red-700" : "text-brand-700"
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
