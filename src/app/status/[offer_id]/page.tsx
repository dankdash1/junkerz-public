"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

type StatusData = {
  status: string;
  address: string | null;
  slot: string | null;
  driver_name: string | null;
  eta_message: string;
};

export default function StatusPage() {
  const params = useParams();
  const offerId = Number(params.offer_id);
  const [data, setData] = useState<StatusData | null>(null);

  useEffect(() => {
    if (!offerId) return;
    let mounted = true;
    async function tick() {
      const MAX = 60; // 60 × 10s = 10 min
      let n = 0;
      while (mounted && n < MAX) {
        n++;
        try {
          const r = await fetch(
            `${BASE}/api/public/junkerz/pickup/${offerId}/status`,
          );
          if (mounted && r.ok) setData(await r.json());
        } catch {
          // ignore — retry next tick
        }
        await new Promise((r) => setTimeout(r, 10_000));
      }
    }
    tick();
    return () => { mounted = false; };
  }, [offerId]);

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
