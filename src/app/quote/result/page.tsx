"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getOffer } from "@/lib/api";

function ResultContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const id = Number(sp.get("id"));
  const [offer, setOffer] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function poll() {
      const MAX_ATTEMPTS = 24; // 24 × 5s = 2 min
      let attempts = 0;
      while (!cancelled && attempts < MAX_ATTEMPTS) {
        attempts++;
        try {
          const o = await getOffer(id);
          if (cancelled) return;
          setOffer(o);
          if (o.status === "ready") return;
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "load failed");
          return;
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
      if (!cancelled) {
        setError("This is taking longer than expected. We'll text you shortly.");
      }
    }
    poll();
    return () => { cancelled = true; };
  }, [id]);

  if (error) return <main className="p-12 text-center text-red-600">{error}</main>;
  if (!offer) return <main className="p-12 text-center">Loading…</main>;

  if (offer.status !== "ready") {
    return (
      <main className="p-12 text-center">
        <h1 className="text-2xl font-semibold">Reviewing your offer</h1>
        <p className="mt-4 text-slate-600">We&apos;ll text you in a few minutes.</p>
      </main>
    );
  }

  return (
    <main className="p-12 text-center">
      <h1 className="text-3xl font-bold">Your Offer</h1>
      <div className="text-6xl font-extrabold mt-8 text-emerald-600">
        ${((offer.offer_cents as number) / 100).toFixed(0)}
      </div>
      <p className="mt-4 text-slate-600">Tier: {offer.tier as string}</p>
      <Button
        size="lg"
        className="mt-12 h-14 px-10"
        onClick={() => router.push(`/pickup/${offer.offer_id as number}`)}
      >Schedule Pickup →</Button>
    </main>
  );
}

export default function Result() {
  return (
    <Suspense fallback={<main className="p-12 text-center">Loading…</main>}>
      <ResultContent />
    </Suspense>
  );
}
