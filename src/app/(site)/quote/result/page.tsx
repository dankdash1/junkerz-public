"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Phone, ArrowRight, Truck, Clock, BadgeDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { NOT_LIVE_COPY, PICKUPS_LIVE, SITE } from "@/lib/site";
import { getOffer } from "@/lib/api";

const mono = "font-[family-name:var(--font-geist-mono)]";

type Offer = {
  offer_id?: number;
  status?: string;
  offer_cents?: number;
  tier?: string;
  requires_human_approval?: boolean;
  token?: string | null;
  seller_checkin_enabled?: boolean;
  // 2026-11-25 bid ask: no buyer would win this car yet, so the backend hides
  // the price and asks every buyer first. The seller gets a text with the offer.
  checking_buyers?: boolean;
  message?: string;
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
    centsFromUrl ? { offer_cents: centsFromUrl, status: sp.get("status") || "reviewing", requires_human_approval: sp.get("review") === "1", seller_checkin_enabled: sp.get("checkin") === "1" } : null
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const notLive = es ? NOT_LIVE_COPY.es : NOT_LIVE_COPY.en;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let hasSnapshot = Boolean(centsFromUrl);
    const maxAttempts = 24;
    let requiresReview = sp.get("review") === "1";
    (async () => {
      // Poll for a while in case staff approve while the seller is still here,
      // but never block showing the number on it.
      for (let i = 0; i < maxAttempts && !cancelled; i++) {
        try {
          const o = (await getOffer(id)) as Offer;
          if (cancelled) return;
          hasSnapshot = true;
          if (typeof o.requires_human_approval === "boolean") requiresReview = o.requires_human_approval;
          setOffer((prev) => ({ ...prev, ...o, requires_human_approval: requiresReview }));
          if ((o.status === "ready" && !requiresReview) || o.status === "seller_accepted") return;
        } catch {
          if (cancelled) return;
          if (i === maxAttempts - 1 && !hasSnapshot) {
            setError(es ? "No pudimos cargar su oferta." : "We couldn't load your offer.");
          }
        }
        if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, 5000));
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const token = offer?.token || tokenFromUrl;
  const cents = offer?.offer_cents ?? (centsFromUrl || undefined);
  const confirmed = !offer?.requires_human_approval && offer?.status === "ready";
  const accepted = offer?.status === "seller_accepted";
  const langQuery = es ? "?lang=es" : "";
  const checkingBuyers = !cents && (offer?.status === "checking_buyers" || offer?.checking_buyers === true || sp.get("status") === "checking_buyers");


  const t = es
    ? { head: "Su oferta", pending: "Un compañero está confirmando este número ahora.",
        accepted: "Aceptó esta oferta. Su comprador confirmará los detalles del vehículo, los documentos y los arreglos de recogida.",
        firm: "Oferta garantizada cuando el vehículo, su condición, piezas principales y datos de propiedad coinciden con lo que indicó. Cualquier diferencia debe explicarse antes de que acepte una oferta revisada.", accept: "Aceptar y programar la grúa",
        share: "Compartir otra oferta", decline: "Rechazar oferta", call: "O llámenos",
        free: "Grúa gratis", cash: "Efectivo al recoger", fast: "Sujeto a disponibilidad",
        wait: "Estamos calculando su oferta…",
        paperwork: "Después de aceptar, su comprador independiente revisará el VIN y los documentos de propiedad. El comprador compra el carro y es responsable del pago; el socio de recogida lo recoge. Tenga su teléfono cerca y revise su correo. El socio le llamará una vez asignado para confirmar la recogida y los detalles del pago." }
    : { head: "Your offer", pending: "One of our team is confirming this number now.",
        accepted: "You accepted this offer. Your buyer will confirm the vehicle details, paperwork and pickup arrangements.",
        firm: "Your offer is guaranteed when the vehicle, condition, major parts and ownership details match your description. Any difference must be explained before you agree to a revised offer.", accept: "Accept & schedule pickup",
        share: "Share another offer", decline: "Decline offer", call: "Or call us",
        free: "Free towing", cash: "Cash at pickup", fast: "Subject to availability",
        wait: "Working out your offer…",
        paperwork: "After you accept, your independent buyer will review the VIN and ownership paperwork. The buyer purchases the vehicle and is responsible for payment; the pickup partner collects it. Keep your phone nearby and check your email. Your pickup partner will call once assigned to confirm the pickup and payment details." };

  const responseLinks = token && !accepted && (
    <div className="mt-4 space-y-2 text-center text-sm">
      {offer?.seller_checkin_enabled && <Link prefetch={false} href={`/offer-response/${token}${langQuery}#outside-offer`}
        className="block font-semibold text-zinc-800 underline underline-offset-2">
        {t.share}
      </Link>}
      <Link prefetch={false} href={`/decline/${token}${langQuery}`}
        className="block text-zinc-500 underline underline-offset-2 hover:text-zinc-800">
        {t.decline}
      </Link>
    </div>
  );

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

  if (checkingBuyers) {
    const checkingCopy = es
      ? "Estamos consultando con nuestros compradores para conseguirle la mejor oferta. Le enviaremos un mensaje de texto en aproximadamente 2 horas."
      : "We're checking with our buyers to get you the best offer. We'll text you within about 2 hours.";
    return (
      <div className="mx-auto max-w-lg px-5 pb-16 pt-10" data-testid="checking-buyers">
        <div className="rounded-2xl border border-zinc-200 bg-white p-7 text-center shadow-[0_20px_60px_-20px_rgba(16,24,28,.2)]">
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 ${mono}`}>
            {t.head}
          </p>
          <BadgeDollarSign className="mx-auto mt-4 h-12 w-12 text-brand-600" />
          <p className="mt-4 text-lg font-semibold text-zinc-900">
            {es ? "Buscando su mejor oferta" : "Finding your best offer"}
          </p>
          <p className="mt-3 text-sm text-zinc-600">{(!es && offer?.message) || checkingCopy}</p>
        </div>
        <div className="mt-8 text-center">
          <span className="text-sm text-zinc-500">{t.call} </span>
          <a href={SITE.phoneHref} className={`font-bold text-zinc-900 underline ${mono}`}>
            {SITE.phone}
          </a>
        </div>
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
          {(cents / 100).toLocaleString(es ? "es-US" : "en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}
        </div>

        <p className={`mt-3 text-sm ${confirmed ? "text-brand-700" : "text-zinc-500"}`}>
          {accepted ? t.accepted : confirmed ? t.firm : t.pending}
        </p>

        <div className="my-6 border-t border-dashed border-zinc-200" />
        <div className="grid grid-cols-3 gap-3 text-center">
          {[[Truck, t.free], [BadgeDollarSign, t.cash], [Clock, PICKUPS_LIVE ? t.fast : (es ? "Recogidas pronto" : "Pickups start soon")]].map(([Icon, label]) => {
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

      <p className="mt-5 text-center text-sm text-zinc-600">{t.paperwork}</p>

      {!PICKUPS_LIVE ? (
        saved ? (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm font-semibold text-amber-950" role="status">
            {notLive.saved}
          </p>
        ) : (
          <>
            <p className="mt-6 text-center text-sm text-zinc-600">{notLive.title}.</p>
            <Button className="mt-3 h-14 w-full gap-2 text-base font-bold" onClick={() => setSaved(true)}>
              <Check className="h-5 w-5" /> {notLive.save}
            </Button>
            {responseLinks}
          </>
        )
      ) : token ? (
        <>
          <Link prefetch={false} href={`/schedule/${token}${langQuery}`} className="mt-6 block">
            <Button className="h-14 w-full gap-2 text-base font-bold">
              <Check className="h-5 w-5" /> {t.accept}
            </Button>
          </Link>
          {responseLinks}
        </>
      ) : (
        <p className="mt-6 text-center text-sm text-zinc-500">
          {es ? "Revise su correo para encontrar el enlace privado de su oferta. Si no llega, llámenos." :
                "Check your email for your private offer link. If it hasn't arrived, call us."}
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
