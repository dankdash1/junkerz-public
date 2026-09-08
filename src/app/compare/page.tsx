import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { SITE } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata: Metadata = {
  title: "Quote form — seven steps or four",
  robots: { index: false, follow: false },
};

const SEVEN = [
  ["The car", "Year, make, model, VIN, mileage"],
  ["Title", "Clean, salvage, rebuilt or none"],
  ["Does it run", "Runs, starts, wheels on, tyres up"],
  ["What's on it", "Engine, transmission, converter, battery, keys"],
  ["Damage", "Tap each panel that is wrecked"],
  ["Where is it", "Zip code and pickup address"],
  ["Contact", "Phone and email"],
];

const FOUR = [
  ["Which car are we buying?", "Year, make, model. VIN only if handy."],
  ["Paperwork and pulse", "Title, does it drive, does it turn over, wheels on"],
  ["What is still bolted to it?", "Engine, transmission, converter, keys — pre-filled with the usual answers. Damage is optional and folded in."],
  ["Where is it, and how do we reach you?", "Zip, address, phone, email — all on one screen"],
];

function Card({
  badge, badgeClass, steps, rows, blurb, href, cta,
}: {
  badge: string; badgeClass: string; steps: number;
  rows: string[][]; blurb: string; href: string; cta: string;
}) {
  return (
    <section className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8">
      <div className="text-center">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white ${badgeClass} ${mono}`}>
          {badge}
        </span>
        <div className={`mt-4 text-5xl font-extrabold tracking-tight ${mono}`}>{steps}</div>
        <div className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          screens
        </div>
        <p className="mt-4 text-sm text-zinc-600">{blurb}</p>
      </div>

      <ol className="mt-7 flex-1 space-y-3">
        {rows.map(([t, b], i) => (
          <li key={t} className="flex gap-3">
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white ${mono}`}>
              {i + 1}
            </span>
            <div>
              <div className="text-[15px] font-bold text-zinc-900">{t}</div>
              <div className="text-sm text-zinc-600">{b}</div>
            </div>
          </li>
        ))}
      </ol>

      <Link href={href} className="mt-7 block">
        <Button className="h-14 w-full gap-2 text-base font-bold">
          {cta} <ArrowRight className="h-5 w-5" />
        </Button>
      </Link>
    </section>
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

      <div className="mx-auto max-w-5xl px-5 py-10">
        <h1 className="text-center text-3xl font-extrabold tracking-tight">
          The quote form — seven screens or four
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-600">
          Same questions, same offer, same box layout you liked. The short one
          just groups them onto fewer screens. Both are live — open each and
          click through.
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <Card
            badge="Option A — live now"
            badgeClass="bg-zinc-900"
            steps={7}
            rows={SEVEN}
            blurb="One question per screen. Nothing is assumed, so every answer is the seller's own."
            href="/quote"
            cta="Try the seven-step"
          />
          <Card
            badge="Option B — the short one"
            badgeClass="bg-brand-600"
            steps={4}
            rows={FOUR}
            blurb="Same questions, grouped. The parts screen arrives pre-filled with the common answers, so it is a quick confirm rather than five taps."
            href="/quote-short"
            cta="Try the four-step"
          />
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6">
          <h3 className="font-extrabold">The trade-off, plainly</h3>
          <ul className="mt-3 space-y-2 text-[15px] text-zinc-700">
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
              <span><b>Seven</b> asks everything outright. More people give up
              partway, but every answer is deliberate.</span></li>
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
              <span><b>Four</b> finishes faster, so more quotes get completed. The
              risk is a seller leaving a pre-filled answer wrong, which changes the
              price at pickup.</span></li>
            <li className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-brand-600" />
              <span>Both end at the same offer and the same pickup.</span></li>
          </ul>
        </div>
      </div>
    </main>
  );
}
