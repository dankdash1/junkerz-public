"use client";
import { useState } from "react";
import { buyerApi } from "@/lib/buyer-api";
import { Button } from "@/components/ui/button";

type Props = {matchId:number;status:string|null;cents:number|null;invoiceId:number|null;onUpdated:()=>void|Promise<void>};
export default function PaymentRecovery({matchId,status,cents,invoiceId,onUpdated}:Props) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState<string|null>(null);
  const currentStatus=result || status;
  const retryable=currentStatus === "declined" || currentStatus === "pending";
  const statusText=currentStatus === "paid" ? "Finder fee paid." : currentStatus === "declined" ? "Payment declined. Update your card, then retry payment." : currentStatus === "pending" ? "Payment is pending. You can retry to check or complete payment." : "Payment status is unavailable. Contact Junkerz support.";
  return <section className="bg-white border rounded-lg p-4 space-y-3">
    <h2 className="font-semibold">Pickup finder fee</h2>
    <p>{cents == null ? "Amount unavailable" : `$${(cents / 100).toFixed(2)}`}{invoiceId != null && ` · Invoice #${invoiceId}`}</p>
    <p role="status" className="text-sm">{statusText}</p>
    {retryable && <>
      <p className="text-sm text-slate-600">Your pickup is completed. Matching remains paused while a finder fee is outstanding. Retrying authorizes payment of this fee with your saved card.</p>
      <div className="flex flex-wrap items-center gap-4">
        <a href={`/buyers/settings?return_to=${matchId}`} className="text-sm underline">Update card</a>
        <Button disabled={busy} onClick={async()=>{
          if(busy) return;
          setBusy(true);setError("");
          try {
            const response=await buyerApi.retryPickupPayment(matchId);
            setResult(response.charge_status);
            await onUpdated();
          } catch(e) { setError((e as Error).message || "Could not retry payment."); }
          finally {setBusy(false);}
        }}>{busy ? "Processing…" : "Retry payment"}</Button>
      </div>
    </>}
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
  </section>;
}
