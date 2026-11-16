import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import QuoteWizard from "@/components/QuoteWizard";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Get a quote for your junk car in DFW",
  description: "Request a vehicle offer through Junkerz. Start with your vehicle, condition, title status and ZIP code. No VIN or license plate is needed to start your quote.",
  alternates: { canonical: `${SITE.url}/quote` },
};

function QuoteIntroduction() {
  return <main className="min-h-screen bg-zinc-50 px-5 py-16 text-zinc-900">
    <div className="mx-auto max-w-lg space-y-5">
      <Link href="/" className="font-bold text-brand-700">Junkerz</Link>
      <h1 className="text-3xl font-extrabold">Get a junk-car offer in Dallas–Fort Worth</h1>
      <p>Find out what your car is worth. Start with the year, make and model. No VIN or license plate needed.</p>
      <p>Get an offer. Arrange free pickup. Get paid. No obligation to accept.</p>
      <p role="status">Loading the secure quote form…</p>
      <p>Need help starting? Call <a className="font-semibold underline" href={SITE.phoneHref}>{SITE.phone}</a> or <Link className="underline" href="/contact-us">contact Junkerz</Link>.</p>
      <p className="text-sm"><Link href="/terms" className="underline">Offer terms</Link> · <Link href="/privacy-policy" className="underline">Privacy policy</Link></p>
    </div>
  </main>;
}

export default function QuotePage() {
  return <Suspense fallback={<QuoteIntroduction />}><QuoteWizard /></Suspense>;
}
