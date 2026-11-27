"use client";
import { API_BASE } from "@/lib/api-base";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SellerPickupGuidance from "@/components/junkerz/SellerPickupGuidance";
import { readStatusToken, statusRequestInit } from "@/lib/status-link";

const BASE = API_BASE;

export default function StatusPage() {
  const params = useParams();
  const offerId = Number(params.offer_id);
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [data, setData] = useState<any>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [refused, setRefused] = useState(false);

  // Read the token once from the page link, then take it out of the address bar (and so out of history,
  // screenshots and shared links). It is sent to the API only in a header.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const found = readStatusToken(new URLSearchParams(window.location.search), window.location.hash);
    setToken(found);
    if (found) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (!offerId || !token) return;
    let mounted = true;
    async function tick() {
      const MAX = 60;
      let n = 0;
      while (mounted && n < MAX) {
        n++;
        try {
          const r = await fetch(`${BASE}/api/public/junkerz/pickup/${offerId}/status`, statusRequestInit(token!));
          if (mounted && r.status === 404) {
            setRefused(true);
            return;
          }
          if (mounted && r.ok) setData(await r.json());
        } catch {}
        await new Promise((r) => setTimeout(r, 10_000));
      }
      if (mounted) setTimedOut(true);
    }
    tick();
    return () => { mounted = false; };
  }, [offerId, token]);

  if (token === null || refused) {
    return (
      <main className="p-12 text-center">
        <h1 className="text-2xl font-bold">Pickup Status</h1>
        <p className="mt-6 text-slate-700">
          Open this page from the link on your scheduling page or in your Junkerz email to see your pickup status.
        </p>
        <div className="mx-auto mt-6 max-w-md"><SellerPickupGuidance /></div>
      </main>
    );
  }

  if (timedOut && !data?.driver_name) {
    return (
      <main className="p-12 text-center">
        <h1 className="text-2xl font-bold">Pickup Status</h1>
        <p className="mt-6 text-slate-700">
          A pickup partner has not been confirmed here yet. Your preferred time is subject to availability and confirmation.
        </p>
        <div className="mx-auto mt-6 max-w-md"><SellerPickupGuidance /></div>
      </main>
    );
  }

  return (
    <main className="p-12 text-center">
      <h1 className="text-2xl font-bold">Pickup Status</h1>
      <p className="mt-6 text-slate-700">
        {data?.driver_name ? `Driver: ${data.driver_name}` : "Waiting for pickup partner confirmation"}
      </p>
      <p className="text-slate-600 mt-2">{data?.eta_message || ""}</p>
      {data?.slot && <p className="text-slate-500 mt-4">Requested window: {data.slot} (Central), subject to partner confirmation.</p>}
      <div className="mx-auto mt-6 max-w-md"><SellerPickupGuidance /></div>
    </main>
  );
}
