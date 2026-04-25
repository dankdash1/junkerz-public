"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

export default function StatusPage() {
  const params = useParams();
  const offerId = Number(params.offer_id);
  const [data, setData] = useState<any>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!offerId) return;
    let mounted = true;
    async function tick() {
      const MAX = 60;
      let n = 0;
      while (mounted && n < MAX) {
        n++;
        try {
          const r = await fetch(
            `${BASE}/api/public/junkerz/pickup/${offerId}/status`,
          );
          if (mounted && r.ok) setData(await r.json());
        } catch {}
        await new Promise((r) => setTimeout(r, 10_000));
      }
      if (mounted) setTimedOut(true);
    }
    tick();
    return () => { mounted = false; };
  }, [offerId]);

  if (timedOut && !data?.driver_name) {
    return (
      <main className="p-12 text-center">
        <h1 className="text-2xl font-bold">Pickup Status</h1>
        <p className="mt-6 text-slate-700">
          Still working on assigning a driver. We'll text you as soon as one is on the way.
        </p>
      </main>
    );
  }

  return (
    <main className="p-12 text-center">
      <h1 className="text-2xl font-bold">Pickup Status</h1>
      <p className="mt-6 text-slate-700">
        {data?.driver_name ? `Driver: ${data.driver_name}` : "Assigning driver…"}
      </p>
      <p className="text-slate-600 mt-2">{data?.eta_message || ""}</p>
      {data?.slot && <p className="text-slate-500 mt-4">Window: {data.slot}</p>}
    </main>
  );
}
