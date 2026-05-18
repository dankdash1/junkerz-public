"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buyerApi } from "@/lib/buyer-api";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Won", value: "won" },
  { label: "Backup", value: "backup" },
  { label: "Charged", value: "charged" },
  { label: "Picked Up", value: "delivered" },
  { label: "Declined", value: "declined" },
  { label: "Disputed", value: "disputed" },
];

// status -> human label (UI rename: 'delivered' DB value displays as 'Picked Up')
const STATUS_LABEL: Record<string, string> = {
  matched: "Matched",
  won: "Won",
  backup: "Backup",
  charged: "Charged",
  delivered: "Picked Up",
  declined: "Declined",
  disputed: "Disputed",
};

export default function WonCars() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [filter, setFilter] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setErr(null);
      const r = await buyerApi.wonCars(filter || undefined);
      setRows(r);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "load failed");
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function decline(matchId: number) {
    if (!confirm("Decline this match? Reliability score drops by 5.")) return;
    setBusy(true);
    try {
      const r = await buyerApi.declineMatch(matchId);
      alert(
        `Declined. ${r.promoted_backup ? "Backup buyer promoted." : "No backup available."} ` +
          `New reliability: ${r.new_reliability_score?.toFixed(0)}`
      );
      reload();
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "decline failed");
    } finally {
      setBusy(false);
    }
  }

  async function markPickedUp(matchId: number, bidCents: number, vehicle: string) {
    const bid = (bidCents / 100).toFixed(2);
    if (
      !confirm(
        `Mark ${vehicle} as picked up?\n\n` +
          `Your card on file will be charged the finder fee ` +
          `(your bid $${bid} minus the seller's cash offer).\n\n` +
          `The match will move to the Picked Up tab.`
      )
    )
      return;
    setBusy(true);
    try {
      const r = await buyerApi.markPickedUp(matchId);
      if (r?.charge_status === "paid") {
        alert(`Picked up. Card charged $${(r.spread_cents / 100).toFixed(2)}.`);
      } else if (r?.charge_status === "declined") {
        alert(
          `Picked up — BUT card was declined ($${(r.spread_cents / 100).toFixed(2)}). ` +
            `Matching has been paused on your account until you update your card.`
        );
      } else if (r?.stub_mode) {
        alert(
          `Picked up. Invoice posted ($${(r.spread_cents / 100).toFixed(2)}). ` +
            `Stripe is not live yet — payment will reconcile when it goes live.`
        );
      } else {
        alert(`Picked up. Invoice #${r?.invoice_id}.`);
      }
      reload();
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? "mark-picked-up failed";
      if (msg.includes("no_card_on_file")) {
        alert("Add a payment method on the Settings page before completing pickups.");
      } else {
        setErr(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Won Cars</h1>

      <div className="flex flex-wrap gap-2 mb-4 text-sm">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value || "all"}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1 rounded border ${
              filter === f.value
                ? "bg-emerald-600 text-white border-emerald-700"
                : "bg-white text-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {err && <p className="text-red-600 mb-4">{err}</p>}

      {rows === null ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          No matches yet.{" "}
          <Link href="/buyers/bid-rules" className="text-emerald-600 underline">
            Set up bid rules
          </Link>{" "}
          to start receiving cars.
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">VIN</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3">Bid</th>
                <th className="p-3">Finder Fee</th>
                <th className="p-3">Status</th>
                <th className="p-3">When</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.match_id} className="border-t hover:bg-emerald-50/40">
                  <td className="p-3 font-mono text-xs">
                    <Link href={`/buyers/won-cars/${r.match_id}`} className="text-emerald-700 hover:underline">
                      {r.vin || `match #${r.match_id}`}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link href={`/buyers/won-cars/${r.match_id}`} className="hover:underline">
                      {r.year} {r.make} {r.model}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {r.condition} · {r.title_status} · {r.zip_code}
                    </div>
                  </td>
                  <td className="p-3">${(r.bid_cents / 100).toFixed(0)}</td>
                  <td className="p-3 whitespace-nowrap">
                    {r.picked_up_charge_cents != null ? (
                      <>
                        <span className="font-medium">
                          ${(r.picked_up_charge_cents / 100).toFixed(2)}
                        </span>
                        <span
                          className={
                            "ml-2 text-xs px-1.5 py-0.5 rounded " +
                            (r.picked_up_charge_status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.picked_up_charge_status === "declined"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700")
                          }
                        >
                          {r.picked_up_charge_status === "paid"
                            ? "Paid"
                            : r.picked_up_charge_status === "declined"
                            ? "Declined"
                            : "Pending"}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-3">{STATUS_LABEL[r.status] ?? r.status}</td>
                  <td className="p-3 text-xs text-slate-600">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
                  </td>
                  <td className="p-3 space-x-2 whitespace-nowrap">
                    {r.status === "won" && (
                      <>
                        <Button
                          variant="outline"
                          size="default"
                          onClick={() => decline(r.match_id)}
                          disabled={busy}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="default"
                          size="default"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          onClick={() =>
                            markPickedUp(
                              r.match_id,
                              r.bid_cents,
                              `${r.year || ""} ${r.make || ""} ${r.model || ""}`.trim() ||
                                `match #${r.match_id}`
                            )
                          }
                          disabled={busy}
                        >
                          Mark Picked Up
                        </Button>
                      </>
                    )}
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
