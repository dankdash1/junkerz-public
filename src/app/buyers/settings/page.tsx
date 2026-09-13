"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { buyerApi } from "@/lib/buyer-api";
import { Button } from "@/components/ui/button";

type PaymentStatus = { has_payment_method: boolean; auto_pay_enabled: boolean; card: {brand: string; last4: string; exp_month: number; exp_year: number} | null };
function CardForm({onSaved}: {onSaved: () => Promise<void>}) {
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
        if (result.error) throw new Error(result.error.message || "Card authentication failed. Please try again.");
        if (result.setupIntent?.status !== "succeeded") throw new Error("Card setup is not complete. Please try again.");
        confirmedIntent.current = result.setupIntent.id;
      }
      await buyerApi.savePaymentMethod(confirmedIntent.current);
      await onSaved();
    } catch (e) { setError((e as Error).message || "Could not save card."); }
    finally { setBusy(false); }
  }}>
    <PaymentElement onLoadError={() => setError("Secure card entry could not load. Refresh this page to try again.")} />
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />I authorize Junkerz to save this card and charge the applicable finder fee when I complete a pickup, under my buyer agreement.</label>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    <Button type="submit" disabled={!stripe || !elements || !consent || busy}>{busy ? "Saving…" : "Save card"}</Button>
  </form>;
}
export default function PaymentSettings() {
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [setup, setSetup] = useState<{clientSecret: string; stripe: Promise<Stripe | null>; test: boolean} | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [returnMatch, setReturnMatch] = useState<string | null>(null);
  const [message, setMessage] = useState("");
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
          setMessage("Card saved.");
        }
        await refresh();
      } catch (e) { setError((e as Error).message || "Could not load payment settings."); }
      finally {
        const url = new URL(window.location.href);
        for (const key of ["setup_intent", "setup_intent_client_secret", "redirect_status"]) url.searchParams.delete(key);
        window.history.replaceState({}, "", url.pathname + url.search);
        setBusy(false);
      }
    })();
  }, [refresh]);
  const saved = async () => { setSetup(null); setMessage("Card saved."); try { await refresh(); } catch { setError("Your card was saved, but its details could not refresh. Reload this page."); } };
  return <main className="max-w-xl mx-auto p-6 space-y-5">
    <h1 className="text-2xl font-bold">Settings</h1>
    {returnMatch && <a className="block underline text-sm" href={`/buyers/won-cars/${returnMatch}`}>Return to pickup to retry payment</a>}
    {message && returnMatch && <p className="text-sm">Return to your completed pickup and select Retry payment to settle its outstanding finder fee.</p>}
    <section className="bg-white border rounded-lg p-5 space-y-4">
      <h2 className="text-lg font-semibold">Payment method</h2>
      <p className="text-sm text-slate-600">Save a card for pickup finder fees. Saving a card does not charge it. Card details are entered securely through Stripe.</p>
      {status?.card ? <p>{status.card.brand.toUpperCase()} ending in {status.card.last4} · Expires {status.card.exp_month}/{status.card.exp_year}</p> : status && <p>{status.has_payment_method ? "A payment method is on file." : "No card on file."}</p>}
      {message && <p role="status" className="text-green-700">{message}</p>}
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {setup ? <>{setup.test && <p className="text-sm text-amber-800">Stripe test mode — use test card details only.</p>}<Elements stripe={setup.stripe} options={{clientSecret: setup.clientSecret}}><CardForm onSaved={saved}/></Elements></> : <Button disabled={busy} onClick={async () => {
        setBusy(true); setError(""); setMessage("");
        try {
          const data = await buyerApi.createPaymentSetup();
          if (!data.client_secret || !data.publishable_key?.startsWith("pk_")) throw new Error("Card setup is unavailable. Please contact Junkerz support.");
          setSetup({clientSecret:data.client_secret,stripe:loadStripe(data.publishable_key),test:data.publishable_key.startsWith("pk_test_")});
        } catch (e) { setError((e as Error).message || "Card setup is unavailable."); }
        finally { setBusy(false); }
      }}>{busy ? "Loading…" : status?.has_payment_method ? "Replace card" : "Add card"}</Button>}
    </section>
  </main>;
}
