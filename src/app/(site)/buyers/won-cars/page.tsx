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
  const [msg, setMsg] = useState<string | null>(null);

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

  // George 11-18: a won car is like an auction win. The buyer must pick it up;
  // there is no Decline. The buyer can finish and pay right from this list.
  async function completeAndPay(r: any) {
    const fee =
      typeof r.finder_fee_cents === "number" && r.finder_fee_cents > 0
        ? `$${(r.finder_fee_cents / 100).toFixed(2)}`
        : "the finder fee";
    const car = `${r.year ?? ""} ${r.make ?? ""} ${r.model ?? ""}`.trim() || `match #${r.match_id}`;
    if (
      !confirm(
        `Mark the ${car} picked up and pay ${fee} now?\n\n` +
          "Only do this after your driver has the car. " +
          "If the seller did not sign, you can still complete — the missing signature is your responsibility."
      )
    )
      return;
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await buyerApi.pickupComplete(r.match_id);
      const paid = typeof res.spread_cents === "number" ? `$${(res.spread_cents / 100).toFixed(2)}` : fee;
      const payLine =
        res.charge_status === "paid"
          ? `Finder fee paid: ${paid}.`
          : res.charge_status === "declined"
          ? `Your card was declined for ${paid}. Open the car to update your card and retry payment.`
          : "Finder fee payment is pending.";
      setMsg(`✓ ${car} marked complete. ${payLine}`);
      reload();
    } catch (e: unknown) {
      const m = (e as Error)?.message;
      setErr(
        m === "wrong_status"
          ? `${car} cannot be completed from here. Open the car or contact Junkerz.`
          : m === "not_found"
          ? `${car} has no pickup on file yet. Open the pickup checklist or contact Junkerz.`
          : m ?? "Could not mark complete. Please try again."
      );
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
                ? "bg-brand-600 text-white border-brand-700"
                : "bg-white text-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {err && <p className="text-red-600 mb-4">{err}</p>}
      {msg && (
        <p role="status" className="mb-4 rounded border border-brand-200 bg-brand-50 p-3 text-brand-800">
          {msg}
        </p>
      )}

      {rows === null ? (
        <p>Loading…</p>
      ) : rows.length === 0 && filter ? (
        // 2026-11-10 George: an empty tab said "No matches yet" while his car sat
        // under Picked Up, so the tab buttons looked broken.
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          No cars under {STATUS_FILTERS.find((f) => f.value === filter)?.label ?? "this tab"}.{" "}
          <button type="button" onClick={() => setFilter("")} className="text-brand-600 underline">
            Show all cars
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded shadow p-12 text-center text-slate-600">
          No matches yet.{" "}
          <Link href="/buyers/bid-rules" className="text-brand-600 underline">
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
                <tr key={r.match_id} className="border-t hover:bg-brand-50/40">
                  <td className="p-3 font-mono text-xs">
                    <Link href={`/buyers/won-cars/${r.match_id}`} className="text-brand-700 hover:underline">
                      {r.vin || `match #${r.match_id}`}
                    </Link>
                  </td>
                  <td className="p-3">
                    <Link href={`/buyers/won-cars/${r.match_id}`} className="hover:underline">
                      {r.year} {r.make} {r.model}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {r.condition} · {r.title_status} ·{" "}
                      {r.car_city ? `${r.car_city}, ${r.car_state} ${r.zip_code}` : r.zip_code}
                      {r.miles_from_rule_center != null && r.rule_center_city
                        ? ` · ${Math.round(r.miles_from_rule_center)} mi from ${r.rule_center_city}`
                        : ""}
                    </div>
                    {r.rule_name && (
                      <div className="text-xs text-slate-600">
                        Won by your rule:{" "}
                        {r.matched_rule_id ? (
                          <Link
                            href={`/buyers/bid-rules/${r.matched_rule_id}`}
                            className="text-brand-700 hover:underline"
                          >
                            {r.rule_name}
                          </Link>
                        ) : (
                          r.rule_name
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    ${(r.bid_cents / 100).toFixed(0)}
                    {r.offer_cents != null && (
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        Seller gets ${(r.offer_cents / 100).toFixed(0)}
                      </div>
                    )}
                  </td>
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
                              ? "bg-brand-100 text-brand-800"
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
                    ) : r.finder_fee_cents != null && r.status === "won" && r.finder_fee_cents > 0 ? (
                      // Before pickup: bid - seller payout, charged when the pickup is completed.
                      <>
                        <span className="font-medium">${(r.finder_fee_cents / 100).toFixed(2)}</span>
                        <div className="text-xs text-slate-500">charged at pickup</div>
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
                    {/* George 11-18: Picked Up cars get the same buttons until the fee is paid.
                        The server never charges twice (paid = skipped, one-time charge key). */}
                    {(r.status === "won" ||
                      r.status === "disputed" ||
                      (["delivered", "charged", "charge_failed"].includes(r.status) &&
                        r.picked_up_charge_status !== "paid")) && (
                      <>
                        <Link
                          href={`/buyers/won-cars/${r.match_id}`}
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-800 hover:bg-slate-50"
                        >
                          Open pickup checklist
                        </Link>
                        <Button size="default" onClick={() => completeAndPay(r)} disabled={busy}>
                          Mark complete &amp; pay
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
