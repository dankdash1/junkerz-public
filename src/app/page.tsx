import Link from "next/link";
import {
  Check, Truck, BadgeDollarSign, Phone, Star,
  ClipboardList, ArrowRight, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const mono = "font-[family-name:var(--font-geist-mono)]";

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-lg bg-emerald-600 text-white">
              <BadgeDollarSign className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">Junkerz</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="tel:+15805550142"
               className={`hidden items-center gap-1.5 text-sm font-semibold text-zinc-700 hover:text-zinc-900 sm:flex ${mono}`}>
              <Phone className="h-4 w-4" /> (580) 555-0142
            </a>
            <Link href="/quote">
              <Button className="h-10 px-4 font-semibold">Get my offer</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_.95fr] md:py-24">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 ${mono}`}>
              Cash for junk cars · Madill, OK &amp; nationwide
            </p>
            <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Get real cash for your junk car — as soon as{" "}
              <span className="text-emerald-600">today.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-zinc-600">
              Running or not, wrecked or dead, title or no title. Tell us about
              it and get a guaranteed offer — free towing, paid on the spot.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote">
                <Button className="h-14 w-full gap-2 px-8 text-base font-bold sm:w-auto">
                  Get my instant offer <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:+15805550142">
                <Button variant="outline"
                  className="h-14 w-full gap-2 px-6 text-base font-semibold sm:w-auto">
                  <Phone className="h-4 w-4" /> Call us
                </Button>
              </a>
            </div>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="flex text-amber-500">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </span>
                <b className="font-semibold text-zinc-800">4.9/5</b> · 3,100+ sellers
              </span>
            </div>
          </div>

          {/* offer card */}
          <div className="relative">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(16,24,28,.2)]">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 ${mono}`}>
                  Your cash offer
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" /> Guaranteed
                </span>
              </div>
              <div className={`mt-3 text-6xl font-bold tracking-tight tabular-nums ${mono}`}>
                <span className="align-top text-3xl text-emerald-600">$</span>620
              </div>
              <p className="mt-1 text-sm text-zinc-500">2012 Toyota Camry · Madill, OK</p>
              <div className="my-5 border-t border-dashed border-zinc-200" />
              <div className="grid grid-cols-3 gap-3 text-center">
                {[["FREE", "towing"], ["$0", "fees"], ["Today", "pickup"]].map(
                  ([v, k]) => (
                    <div key={k}>
                      <div className={`text-base font-bold ${mono}`}>{v}</div>
                      <div className="text-xs text-zinc-500">{k}</div>
                    </div>
                  )
                )}
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-zinc-400">
              Real offers priced from live scrap, parts &amp; catalytic values.
            </p>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400 ${mono}`}>
            How it works
          </p>
          <h2 className="mt-3 max-w-xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three steps. No dealership, no haggling.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: ClipboardList, n: "01", t: "Tell us about the car", b: "Year, make, model and condition — about two minutes. No VIN hunting required." },
              { icon: BadgeDollarSign, n: "02", t: "Get your real offer", b: "A guaranteed cash number on the spot, priced from live scrap and parts values." },
              { icon: Truck, n: "03", t: "We tow it & pay you", b: "Pick a time, we come to you, hand you cash, and haul it away — free." },
            ].map(({ icon: Icon, n, t, b }) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-7 w-7 text-emerald-400" />
                  <span className={`text-sm font-semibold text-emerald-400/80 ${mono}`}>{n}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* trust stats */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ["2 min", "To a real offer"],
            ["$0", "Towing & fees, always"],
            ["24–48h", "Typical pickup window"],
            ["Any", "Make, model or condition"],
          ].map(([v, k]) => (
            <div key={k} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <div className={`text-3xl font-bold tracking-tight ${mono}`}>{v}</div>
              <div className="mt-1 text-sm font-medium text-zinc-500">{k}</div>
            </div>
          ))}
        </div>
      </section>

      {/* reassurance */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-3xl bg-emerald-600 px-8 py-12 text-white md:px-14 md:py-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-emerald-100">
                <ShieldCheck className="h-5 w-5" />
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${mono}`}>
                  No title? Dead motor? Still worth cash.
                </span>
              </div>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                We buy cars other places turn away.
              </h2>
              <p className="mt-3 text-emerald-50">
                Dead cars still carry real value — scrap metal, the catalytic
                converter, and reusable parts. That&apos;s exactly what we pay for.
              </p>
            </div>
            <Link href="/quote" className="w-full md:w-auto">
              <Button
                className="h-14 w-full gap-2 bg-white px-8 text-base font-bold text-emerald-700 hover:bg-emerald-50 md:w-auto">
                Get my offer <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* faq */}
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Good to know
        </h2>
        <div className="mt-8 divide-y divide-zinc-200">
          {[
            ["Is the offer really guaranteed?", "Yes. The number you see is what we pay, as long as the car matches what you told us — no surprise deductions when the tow truck shows up."],
            ["What if I don't have the title?", "In many cases we can still buy it with your registration and ID. Just tell us during the quote and we'll explain what your state needs."],
            ["Do you really tow it for free?", "Always. Towing and pickup are $0 — the offer you accept is the cash you get, nothing deducted."],
            ["How do I get paid?", "Cash or instant transfer, handed to you at pickup before we load the car. Never a mailed check you have to chase."],
            ["My car doesn't run at all. Worth anything?", "Almost always yes — scrap, the catalytic converter, and parts have real value. Our pricing is built on exactly that."],
          ].map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span className={`text-2xl leading-none text-emerald-600 transition-transform group-open:rotate-45 ${mono}`}>
                  +
                </span>
              </summary>
              <p className="mt-3 text-zinc-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-zinc-500 sm:flex-row">
          <div className="flex items-center gap-2 font-extrabold text-zinc-800">
            <span className="grid h-7 w-7 -rotate-6 place-items-center rounded-md bg-emerald-600 text-white">
              <BadgeDollarSign className="h-4 w-4" />
            </span>
            Junkerz
          </div>
          <div>Cash for junk cars · Madill, OK · (580) 555-0142</div>
          <a href="mailto:hello@junkerz.com" className="underline hover:text-zinc-800">
            hello@junkerz.com
          </a>
        </div>
      </footer>
    </main>
  );
}
