import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import Logo from "@/components/Logo";
import { SITE } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata: Metadata = {
  title: "Quote engine — side by side",
  robots: { index: false, follow: false },
};

/** Option B: the original — a sample offer card, then a button to the wizard. */
function OfferCardVariant() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-[0_20px_60px_-15px_rgba(16,24,28,.2)]">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 ${mono}`}>
            Your cash offer
          </p>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
            <Check className="h-3.5 w-3.5" /> Guaranteed
          </span>
        </div>
        <div className={`mt-3 text-6xl font-bold tracking-tight tabular-nums ${mono}`}>
          <span className="align-top text-3xl text-brand-600">$</span>620
        </div>
        <p className="mt-1 text-sm text-zinc-500">2012 Toyota Camry · Arlington, TX</p>
        <div className="my-5 border-t border-dashed border-zinc-200" />
        <div className="grid grid-cols-3 gap-3 text-center">
          {[["FREE", "towing"], ["$0", "fees"], ["Today", "pickup"]].map(([v, k]) => (
            <div key={k}>
              <div className={`text-base font-bold ${mono}`}>{v}</div>
              <div className="text-xs text-zinc-500">{k}</div>
            </div>
          ))}
        </div>
        <Link href="/quote" className="mt-6 block">
          <Button className="h-14 w-full gap-2 text-base font-bold">
            Get my offer <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-500">
        Sends you to the full seven-step form.
      </p>
    </div>
  );
}

export default function Compare() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/"><Logo height={30} /></Link>
          <a href={SITE.phoneHref}
             className={`hidden items-center gap-1.5 text-sm font-bold text-zinc-800 sm:flex ${mono}`}>
            <Phone className="h-4 w-4" /> {SITE.phone}
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <h1 className="text-center text-3xl font-extrabold tracking-tight">
          Quote engine — pick one
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-zinc-600">
          Both are live and both work. Try each one, then tell me which to keep
          on the homepage.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="text-center">
              <span className={`inline-block rounded-full bg-brand-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${mono}`}>
                Option A — on the page now
              </span>
              <h2 className="mt-4 text-xl font-extrabold">Start it right here</h2>
              <p className="mt-2 text-sm text-zinc-600">
                They pick the car without leaving the homepage. Fewer people
                drop off, because there is nothing to click first.
              </p>
            </div>
            <div className="mt-7"><HeroQuoteForm /></div>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
            <div className="text-center">
              <span className={`inline-block rounded-full bg-zinc-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${mono}`}>
                Option B — the older one
              </span>
              <h2 className="mt-4 text-xl font-extrabold">Show a sample offer first</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Shows what a real payout looks like before asking anything.
                One extra click to reach the form.
              </p>
            </div>
            <div className="mt-7"><OfferCardVariant /></div>
          </section>
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6">
          <h3 className="font-extrabold">The honest difference</h3>
          <ul className="mt-3 space-y-2 text-[15px] text-zinc-700">
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
              <span><b>Option A</b> is what Peddle, Wheelzy and CarBrain all do. Every
              click you remove keeps more people in.</span></li>
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
              <span><b>Option B</b> proves the money is real before you ask for
              anything, which suits people who have never sold a junk car.</span></li>
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
              <span>Both end at the same seven-step form and the same offer.</span></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
