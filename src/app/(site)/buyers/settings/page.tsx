"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { buyerApi } from "@/lib/buyer-api";
import { Button } from "@/components/ui/button";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText, type BuyerText } from "@/components/buyers/buyerText";

type PaymentStatus = { has_payment_method: boolean; auto_pay_enabled: boolean; card: {brand: string; last4: string; exp_month: number; exp_year: number} | null };
// English or Español, from the switch at the top of the buyer pages (2026-11-10).
// Messages Stripe or the server write themselves are shown as they come.
function CardForm({onSaved, t}: {onSaved: () => Promise<void>; t: BuyerText["settings"]}) {
  const stripe = useStripe();
  const elements = useElements();
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirmedIntent = useRef<string | null>(null);
  return <form className="space-y-4" onSubmit={async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !consent || busy) return;
    setBusy(true); setError("");
    try {
      if (!confirmedIntent.current) {
        const result = await stripe.confirmSetup({ elements, confirmParams: { return_url: `${window.location.origin}/buyers/settings${/^[1-9][0-9]*$/.test(new URLSearchParams(window.location.search).get("return_to") || "") ? `?return_to=${new URLSearchParams(window.location.search).get("return_to")}` : ""}` }, redirect: "if_required" });
        if (result.error) throw new Error(result.error.message || t.authFailed);
        if (result.setupIntent?.status !== "succeeded") throw new Error(t.notComplete);
        confirmedIntent.current = result.setupIntent.id;
      }
      await buyerApi.savePaymentMethod(confirmedIntent.current);
      await onSaved();
    } catch (e) { setError((e as Error).message || t.saveFailed); }
    finally { setBusy(false); }
  }}>
    <PaymentElement onLoadError={() => setError(t.secureLoadFailed)} />
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{t.consent}</label>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    <Button type="submit" disabled={!stripe || !elements || !consent || busy}>{busy ? t.saving : t.saveCard}</Button>
  </form>;
}
export default function PaymentSettings() {
  const [lang] = useBuyerLang();
  const T = buyerText(lang);
  const t = T.settings;
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [setup, setSetup] = useState<{clientSecret: string; stripe: Promise<Stripe | null>; test: boolean} | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [returnMatch, setReturnMatch] = useState<string | null>(null);
  const [message, setMessage] = useState<"" | "saved">("");
  const initialized = useRef(false);
  const refresh = useCallback(async () => setStatus(await buyerApi.paymentMethod()), []);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const returnTo = params.get("return_to");
        if (returnTo && /^[1-9][0-9]*$/.test(returnTo)) setReturnMatch(returnTo);
        const intent = params.get("setup_intent");
        if (intent) {
          // The server verifies completion and buyer ownership; URL status is never trusted.
          await buyerApi.savePaymentMethod(intent);
          setMessage("saved");
        }
        await refresh();
      } catch (e) { setError((e as Error).message || t.loadFailed); }
      finally {
        const url = new URL(window.location.href);
        for (const key of ["setup_intent", "setup_intent_client_secret", "redirect_status"]) url.searchParams.delete(key);
        window.history.replaceState({}, "", url.pathname + url.search);
        setBusy(false);
      }
    })();
  }, [refresh]);
  const saved = async () => { setSetup(null); setMessage("saved"); try { await refresh(); } catch { setError(t.refreshFailed); } };
  return <main className="max-w-xl mx-auto p-6 space-y-5" lang={lang}>
    <h1 className="text-2xl font-bold">{t.title}</h1>
    {returnMatch && <a className="block underline text-sm" href={`/buyers/won-cars/${returnMatch}`}>{t.returnLink}</a>}
    {message && returnMatch && <p className="text-sm">{t.returnNote}</p>}
    <section className="bg-white border rounded-lg p-5 space-y-4">
      <h2 className="text-lg font-semibold">{t.paymentTitle}</h2>
      <p className="text-sm text-slate-600">{t.paymentIntro}</p>
      {status?.card ? <p>{t.cardLine(status.card.brand.toUpperCase(), status.card.last4, status.card.exp_month, status.card.exp_year)}</p> : status && <p>{status.has_payment_method ? t.onFile : t.noCard}</p>}
      {message && <p role="status" className="text-green-700">{t.saved}</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {setup ? <>{setup.test && <p className="text-sm text-amber-800">{t.testMode}</p>}<Elements stripe={setup.stripe} options={{clientSecret: setup.clientSecret, locale: lang}}><CardForm onSaved={saved} t={t}/></Elements></> : <Button disabled={busy} onClick={async () => {
        setBusy(true); setError(""); setMessage("");
        try {
          const data = await buyerApi.createPaymentSetup();
          if (!data.client_secret || !data.publishable_key?.startsWith("pk_")) throw new Error(t.unavailable);
          setSetup({clientSecret:data.client_secret,stripe:loadStripe(data.publishable_key),test:data.publishable_key.startsWith("pk_test_")});
        } catch (e) { setError((e as Error).message || t.unavailableShort); }
        finally { setBusy(false); }
      }}>{busy ? T.loading : status?.has_payment_method ? t.replaceCard : t.addCard}</Button>}
    </section>
  </main>;
}
