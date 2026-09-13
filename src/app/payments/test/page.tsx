import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FlaskConical, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import { CartLink } from "@/components/ShopCart";

export const metadata: Metadata = {
  title: "Test a finder’s-fee payment",
  description: "Junkerz sandbox checkout. Test a payment without moving real money.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  openGraph: { title: "Junkerz payment sandbox", description: "Test payments only. No real money is collected." },
};

// Public Stripe sandbox Payment Link, not an API credential. This route must
// remain test-only. Live collections belong in a separate, reviewed flow.
const sandboxCheckout = "https://buy.stripe.com/test_bJe3cueRG7BD5t92UGfEk00";

export default function PaymentTestPage() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-amber-950">
        SANDBOX · Test cards only · No real money is collected
      </div>
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" aria-label="Junkerz home"><Logo height={30} priority /></Link>
          <CartLink />
          <Link href="/buyers/login" className="text-sm font-semibold text-zinc-600 hover:text-brand-700">
            Buyer sign in <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-16">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-brand-700">
          <FlaskConical className="h-4 w-4" aria-hidden="true" /> Junkerz payment test
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Try a finder’s-fee payment.</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-600">
          Walk through checkout with a test card. Try a successful payment or a declined card before we accept real payments here.
        </p>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section aria-labelledby="fee-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 id="fee-heading" className="text-lg font-bold">Vehicle finder’s fee</h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">TEST ONLY</span>
            </div>
            <p className="mt-7 text-5xl font-extrabold tracking-tight">$100<span className="ml-2 text-sm font-medium text-zinc-500">USD</span></p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Starts at $100. Change the test amount to anything from $50 to $150 on Stripe’s checkout page.
            </p>
            <a href={sandboxCheckout} className="mt-7 flex min-h-14 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-4 text-base font-bold text-white transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600">
              Open test checkout <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <p className="mt-4 flex items-start gap-2 text-sm leading-relaxed text-zinc-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Card details are entered securely on Stripe. Use the test numbers shown here, never your real card.
            </p>
          </section>

          <section aria-labelledby="cards-heading" className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
            <h2 id="cards-heading" className="text-lg font-bold">Two cards to try</h2>
            <div className="mt-5 space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <h3 className="text-sm font-bold text-emerald-900">Successful payment</h3>
                <p className="mt-2 select-all break-words font-mono text-lg font-semibold tracking-wide sm:text-xl">4242 4242 4242 4242</p>
                <p className="mt-2 text-sm text-emerald-900">Stripe should show a successful sandbox payment.</p>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-sm font-bold">Declined payment</h3>
                <p className="mt-2 select-all break-words font-mono text-lg font-semibold tracking-wide sm:text-xl">4000 0000 0000 0002</p>
                <p className="mt-2 text-sm text-zinc-600">Stripe should decline it and let you try another card.</p>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-zinc-600">
              Use a future expiration date, any three-digit CVC, and a test name. For example: <strong>12/30</strong>, <strong>123</strong>, <strong>Test Buyer</strong>.
            </p>
            <a className="mt-3 inline-block text-sm font-semibold text-brand-700 underline underline-offset-4" href="https://docs.stripe.com/testing">Stripe’s test-card instructions</a>
          </section>
        </div>

        <section aria-labelledby="scope-heading" className="mt-6 rounded-2xl border border-zinc-200 px-6 py-5 sm:px-8">
          <h2 id="scope-heading" className="font-bold">What this test covers</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
            This tests a one-time card payment and Stripe’s confirmation screen. It does not complete a pickup, save a card for automatic billing, or settle a buyer’s balance. Those connections still need to be built and tested before going live.
          </p>
        </section>
        <Link href="/" className="mt-8 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Junkerz
        </Link>
      </div>
    </main>
  );
}
