"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SLOTS = [
  "Tomorrow 10AM-12PM",
  "Tomorrow 1PM-3PM",
  "Tomorrow 4PM-6PM",
];
const PAYMENT_METHODS = ["zelle", "cash", "check"];
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

export default function PickupPage() {
  const params = useParams();
  const router = useRouter();
  const offerId = Number(params.offer_id);

  const [slot, setSlot] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("zelle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function schedule() {
    setSubmitting(true);
    setError(null);
    try {
      // Mark accepted
      const acceptRes = await fetch(
        `${BASE}/api/public/junkerz/offer/${offerId}/accept`,
        { method: "POST" },
      );
      if (!acceptRes.ok && acceptRes.status !== 404) {
        // 404 could mean already accepted — keep going
        throw new Error("Could not accept offer");
      }

      // Schedule pickup
      const r = await fetch(
        `${BASE}/api/public/junkerz/pickup/${offerId}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, address, payment_method: paymentMethod, phone }),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `schedule failed: ${r.status}`);
      }
      router.push(`/status/${offerId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to schedule");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = !!slot && !!address && !!phone;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-md mx-auto pt-12 space-y-6">
        <h1 className="text-2xl font-bold">Schedule Pickup</h1>

        <div className="space-y-2">
          <Label>Pickup window</Label>
          {SLOTS.map((s) => (
            <Button
              key={s}
              variant={slot === s ? "default" : "outline"}
              className="w-full"
              onClick={() => setSlot(s)}
            >{s}</Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Payment method</Label>
          {PAYMENT_METHODS.map((m) => (
            <Button
              key={m}
              variant={paymentMethod === m ? "default" : "outline"}
              className="w-full"
              onClick={() => setPaymentMethod(m)}
            >{m}</Button>
          ))}
        </div>

        {error && <p className="text-red-600">{error}</p>}

        <Button
          className="w-full h-12"
          disabled={!canSubmit || submitting}
          onClick={schedule}
        >{submitting ? "Scheduling..." : "Confirm pickup"}</Button>
      </div>
    </main>
  );
}
