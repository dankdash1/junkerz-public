"use client";
import { useState } from "react";
import { buyerApi } from "@/lib/buyer-api";
import { Button } from "@/components/ui/button";

export default function SignedBillOfSaleDownload({ matchId }: { matchId: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const download = async () => {
    setBusy(true); setError(null);
    try {
      const blob = await buyerApi.pickupBillOfSale(matchId);
      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `signed-bill-of-sale-${matchId}.pdf`;
        anchor.click();
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "The signed Bill of Sale is unavailable. Contact Junkerz for help.");
    } finally {
      setBusy(false);
    }
  };
  return <section className="rounded-lg border bg-white p-4 space-y-2">
    <Button variant="outline" onClick={download} disabled={busy}>
      {busy ? "Preparing signed copy…" : "Download signed bill of sale"}
    </Button>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}
