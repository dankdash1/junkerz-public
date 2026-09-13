"use client";
import { useState } from "react";
import { buyerApi } from "@/lib/buyer-api";
import { Button } from "@/components/ui/button";
export default function PickupStart({matchId,status,etaAt,onStarted}: {matchId:number;status:string|null;etaAt:string|null;onStarted:()=>void|Promise<void>}) {
  const [eta, setEta] = useState("30");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!["scheduled", "pending", "assigned", "buyer_notified", "reassigned", "en_route"].includes(status || "")) return null;
  if (status === "en_route") return <section className="bg-white border rounded-lg p-4"><h2 className="font-semibold">You&apos;re on your way</h2>{etaAt && <p>ETA {new Date(etaAt).toLocaleString()}</p>}</section>;
  return <form className="bg-white border rounded-lg p-4 space-y-3" onSubmit={async (e) => {
    e.preventDefault();
    const minutes = Number(eta);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) { setError("Enter an ETA from 1 to 240 minutes."); return; }
    if (busy) return;
    setBusy(true); setError("");
    try { await buyerApi.startPickup(matchId,minutes); await onStarted(); }
    catch (e) { setError((e as Error).message || "Could not start pickup."); }
    finally { setBusy(false); }
  }}>
    <h2 className="font-semibold">Head to pickup</h2>
    <p className="text-sm text-slate-600">Let the seller know you&apos;re on the way and when to expect you.</p>
    <label className="block text-sm">ETA in minutes<input className="block border rounded p-2 mt-1 w-full" type="number" min="1" max="240" step="1" required value={eta} onChange={(e)=>setEta(e.target.value)}/></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <Button disabled={busy} type="submit">{busy ? "Sending…" : "I'm on my way"}</Button>
  </form>;
}
