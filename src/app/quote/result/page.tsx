"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Phone, ArrowRight, Truck, Clock, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { SITE } from "@/lib/site";
import { getOffer } from "@/lib/api";

const mono = "font-[family-name:var(--font-geist-mono)]";

type Offer = {
  offer_id?: number;
  status?: string;
  offer_cents?: number;
  tier?: string;
  token?: string | null;
};

function ResultContent() {
  const sp = useSearchParams();
  const id = Number(sp.get("id"));
  // Handed over by the wizard so we can show the number and act on it
  // immediately, rather than waiting for a status that may never arrive.
  const tokenFromUrl = sp.get("token");
  const centsFromUrl = Number(sp.get("cents"));
  const es = sp.get("lang") === "es";

  const [offer, setOffer] = useState<Offer | null>(
    centsFromUrl ? { offer_cents: centsFromUrl, status: sp.get("status") || "reviewing" } : null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      // Poll for a while in case staff approve while the seller is still here,
      // but never block showing the number on it.
      for (let i = 0; i < 24 && !cancelled; i++) {
        try {
          const o = (await getOffer(id)) as Offer;
          if (cancelled) return;
          setOffer((prev) => ({ ...prev, ...o }));
          if (o.status === "ready" || o.status === "seller_accepted") return;
        } catch {
          if (!offer) setError(es ? "No pudimos cargar su oferta." : "We couldn't load your offer.");
          return;
        }
        await new Promise((r) => setTimeout(r, 5000));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const token = offer?.token || tokenFromUrl;
  const cents = offer?.offer_cents ?? (centsFromUrl || undefined);
  const confirmed = offer?.status === "ready" || offer?.status === "seller_accepted";

  const t = es
    ? { head: "Su oferta", pending: "Un compañero está confirmando este número ahora.",
        firm: "Oferta garantizada.", accept: "Aceptar y programar la grúa",
        decline: "¿No le sirve? Díganos por qué", call: "O llámenos",
        free: "Grúa gratis", cash: "Efectivo al recoger", fast: "24 a 48 horas",
        wait: "Estamos calculando su oferta…" }
    : { head: "Your offer", pending: "One of our team is confirming this number now.",
        firm: "This is a guaranteed offer.", accept: "Accept & schedule pickup",
        decline: "Not right? Tell us why", call: "Or call us",
        free: "Free towing", cash: "Cash at pickup", fast: "24 to 48 hours",
        wait: "Working out your offer…" };

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <p className="text-zinc-700">{error}</p>
        <a href={SITE.phoneHref} className="mt-5 inline-block">
          <Button className="h-12 gap-2 px-6 font-bold">
            <Phone className="h-4 w-4" /> {SITE.phone}
          </Button>
        </a>
      </div>
    );
  }

  if (!cents) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-brand-600" />
        <p className="mt-5 text-zinc-600">{t.wait}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 pb-16 pt-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-7 text-center shadow-[0_20px_60px_-20px_rgba(16,24,28,.2)]">
        <p className={`text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 ${mono}`}>
          {t.head}
        </p>
        <div className={`mt-3 text-6xl font-bold tracking-tight tabular-nums ${mono}`}>
          <span className="align-top text-3xl text-brand-600">$</span>
          {(cents / 100).toFixed(0)}
        </div>

        <p className={`mt-3 text-sm ${confirmed ? "text-brand-700" : "text-zinc-500"}`}>
          {confirmed ? t.firm : t.pending}
        </p>

        <div className="my-6 border-t border-dashed border-zinc-200" />
        <div className="grid grid-cols-3 gap-3 text-center">
          {[[Truck, t.free], [BadgeDollarSign, t.cash], [Clock, t.fast]].map(([Icon, label]) => {
            const I = Icon as typeof Truck;
            return (
              <div key={label as string}>
                <I className="mx-auto h-5 w-5 text-brand-600" />
                <div className="mt-1 text-xs text-zinc-600">{label as string}</div>
              </div>
            );
          })}
        </div>
      </div>

      {token ? (
        <>
          <Link href={`/schedule/${token}`} className="mt-6 block">
            <Button className="h-14 w-full gap-2 text-base font-bold">
              <Check className="h-5 w-5" /> {t.accept}
            </Button>
          </Link>
          <Link href={`/decline/${token}`} className="mt-3 block text-center">
            <span className="text-sm font-semibold text-zinc-500 underline hover:text-zinc-800">
              {t.decline}
            </span>
          </Link>
        </>
      ) : (
        <p className="mt-6 text-center text-sm text-zinc-500">
          {es ? "Le mandamos la oferta por correo en un momento." :
                "We're emailing this offer to you now."}
        </p>
      )}

      <div className="mt-8 text-center">
        <span className="text-sm text-zinc-500">{t.call} </span>
        <a href={SITE.phoneHref} className={`font-bold text-zinc-900 underline ${mono}`}>
          {SITE.phone}
        </a>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
          <Link href="/"><Logo height={30} /></Link>
          <a href={SITE.phoneHref}
             className={`flex items-center gap-1.5 text-sm font-bold text-zinc-800 ${mono}`}>
            <Phone className="h-4 w-4" /> {SITE.phone}
          </a>
        </div>
      </header>
      <Suspense fallback={<div className="p-16 text-center text-zinc-500">Loading…</div>}>
        <ResultContent />
      </Suspense>
    </main>
  );
}
