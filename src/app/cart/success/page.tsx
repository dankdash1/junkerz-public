import Link from "next/link";
import { SiteHeader } from "@/components/PageShell";
export const dynamic = "force-dynamic";
export const metadata = { title: "Sandbox checkout result", robots: { index: false, follow: false } };

export default async function Success({ searchParams }: { searchParams: { session_id?: string } }) {
  let paid = false;
  const id = searchParams.session_id;
  const key = process.env.STRIPE_SANDBOX_SECRET_KEY;
  if (id && /^cs_test_[A-Za-z0-9]+$/.test(id) && key?.startsWith("sk_test_")) {
    try {
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(10000) });
      const session = await response.json();
      paid = response.ok && session.livemode === false && session.payment_status === "paid" && session.metadata?.source === "junkerz_sandbox_cart" && session.metadata?.organization_id === "4";
    } catch { /* An unverifiable redirect must never claim payment succeeded. */ }
  }
  return <main><SiteHeader /><section className="mx-auto max-w-xl px-5 py-16"><p className="font-bold text-amber-700">SANDBOX</p><h1 className="mt-4 text-3xl font-extrabold">{paid ? "Test payment successful" : "Payment could not be confirmed"}</h1><p className="mt-5 text-zinc-600">{paid ? "Your simulated cars and parts payment was confirmed by Stripe. No real money moved and no real inventory was sold." : "We could not verify a successful sandbox payment. Check Stripe’s sandbox before trying again."}</p><Link href="/shop" className="mt-8 inline-block font-bold text-brand-700">Return to cars &amp; parts →</Link></section></main>;
}
