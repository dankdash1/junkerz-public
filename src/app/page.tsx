import Link from "next/link";
import Logo from "@/components/Logo";
import StickyMobileBar from "@/components/StickyMobileBar";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import type { Metadata } from "next";
import {
  Truck, BadgeDollarSign, Phone, ClipboardList, ArrowRight,
  ShieldCheck, MapPin, Quote, Wrench, FileText, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE, TESTIMONIALS, CITIES } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

export const metadata: Metadata = {
  title: "Cash for Junk Cars in Dallas–Fort Worth | Junkerz",
  description:
    "Junkerz buys junk, wrecked and non-running cars across Dallas–Fort Worth. Get a real cash offer in about a minute, free towing, paid at pickup. Call 817-420-9180.",
  alternates: { canonical: SITE.url },
  openGraph: {
    title: "Cash for Junk Cars in Dallas–Fort Worth",
    description:
      "Real cash offer in about a minute. Free towing anywhere in DFW. Paid when we pick it up.",
    url: SITE.url,
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
};

type HomeContent = {
  hero_eyebrow: string;
  hero_title: string;
  hero_subtitle: string;
  hero_cta: string;
  phone: string;
  sample_offer_amount: string;
  sample_offer_vehicle: string;
};

const DEFAULTS: HomeContent = {
  hero_eyebrow: `Cash for junk cars · ${SITE.areaLabel}`,
  hero_title: "Your junk car is worth real cash. Find out in a minute.",
  hero_subtitle:
    "Running or not, wrecked or dead, title or no title. Tell us what you have and we will give you a guaranteed number. Free towing anywhere in DFW, cash in your hand when we collect it.",
  hero_cta: "See what it's worth",
  phone: SITE.phone,
  sample_offer_amount: "620",
  sample_offer_vehicle: "2012 Toyota Camry · Arlington, TX",
};

const FAQ: [string, string][] = [
  ["Do I need the title to sell my car?",
   "Not always. In Texas we can often buy a vehicle with your registration and photo ID instead. Tell us during the quote and we will say exactly what your situation needs before anyone drives out."],
  ["Is the towing really free?",
   "Yes, everywhere we serve. We do not deduct a tow fee, a paperwork fee, or anything else. The number you accept is the number you are handed."],
  ["How far out do you come?",
   "Roughly two hours from the middle of Dallas–Fort Worth. That reaches Gainesville in the north, Midlothian and Ennis in the south, Weatherford in the west and Greenville in the east."],
  ["My car does not run at all. Is it still worth something?",
   "Almost always. The value sits in the scrap weight, the catalytic converter and the reusable parts, none of which need the engine to start. Non-running cars are most of what we buy."],
  ["How fast can you pick it up?",
   "Usually within 24 to 48 hours, and often the same day for pickups close to the yard in north Dallas. If you are on an apartment or city tow deadline, say so and we will work to it."],
  ["How do I get paid?",
   "On the spot, when we collect the car, before it goes on the truck. Never a cheque in the post that you have to chase."],
  ["What kinds of vehicles do you buy?",
   "Cars, trucks, vans and SUVs. Wrecked, flooded, burned, stripped, seized, or simply worn out. We also buy vehicles that have been sitting for years and will not move under their own power."],
];

async function getContent(): Promise<HomeContent> {
  try {
    const res = await fetch(`${API_BASE}/api/public/junkerz/homepage`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return DEFAULTS;
    const data = await res.json();
    const c = (data && data.content) || {};
    const merged = { ...DEFAULTS };
    (Object.keys(DEFAULTS) as (keyof HomeContent)[]).forEach((k) => {
      if (typeof c[k] === "string" && c[k].trim() !== "") merged[k] = c[k];
    });
    return merged;
  } catch {
    return DEFAULTS;
  }
}

export default async function Landing() {
  const c = await getContent();
  const telHref = `tel:+1${c.phone.replace(/\D/g, "")}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["AutoDealer", "LocalBusiness"],
        "@id": `${SITE.url}/#business`,
        name: SITE.legal,
        description:
          "Junkerz buys junk, wrecked and non-running cars for cash across Dallas–Fort Worth, with free towing and payment at pickup.",
        url: SITE.url,
        telephone: SITE.phone,
        email: SITE.email,
        foundingDate: SITE.founded,
        priceRange: "$$",
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.street,
          addressLocality: SITE.city,
          addressRegion: SITE.state,
          postalCode: SITE.postal,
          addressCountry: SITE.country,
        },
        geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
        openingHours: SITE.hours,
        areaServed: CITIES.map((x) => ({
          "@type": "City", name: `${x.name}, TX`,
        })),
        makesOffer: {
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: "Cash for junk cars with free towing" },
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        mainEntity: FAQ.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white pb-20 text-zinc-900 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <Logo height={34} priority />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 lg:flex">
            <Link href="/junk-cars" className="hover:text-zinc-900">Wrecked cars</Link>
            <Link href="/not-running" className="hover:text-zinc-900">Not running</Link>
            <Link href="/about-us" className="hover:text-zinc-900">About</Link>
            <Link href="/carro-viejos" className="hover:text-zinc-900">Español</Link>
          </nav>
          <div className="flex items-center gap-3">
            <a href={telHref}
               className={`hidden items-center gap-1.5 text-sm font-bold text-zinc-800 hover:text-brand-700 sm:flex ${mono}`}>
              <Phone className="h-4 w-4" /> {c.phone}
            </a>
            <Link href="/quote">
              <Button className="h-10 px-4 font-semibold">Get my offer</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* hero — the quote engine is the centrepiece, headline above and below */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-3xl px-5 py-12 text-center md:py-16">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 ${mono}`}>
            {c.hero_eyebrow}
          </p>

          {/* headline sits directly on top of the quote engine */}
          <h1 className="mx-auto mt-4 max-w-2xl text-balance text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl md:text-5xl">
            {c.hero_title}
          </h1>

          {/* the quote engine */}
          <div className="mt-7">
            <HeroQuoteForm />
          </div>

          {/* and the promise underneath it */}
          <p className="mx-auto mt-7 max-w-xl text-lg text-zinc-600">
            {c.hero_subtitle}
          </p>

          <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-[15px] text-zinc-700 sm:grid-cols-2">
            {[
              [Truck, "Free towing, every pickup"],
              [BadgeDollarSign, "Cash handed over at collection"],
              [FileText, "Often no title needed"],
              [Clock, "Most pickups in 24 to 48 hours"],
            ].map(([Icon, t]) => {
              const I = Icon as typeof Truck;
              return (
                <li key={t as string} className="flex items-center justify-center gap-2 sm:justify-start">
                  <I className="h-4 w-4 shrink-0 text-brand-600" />
                  <span>{t as string}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="text-sm text-zinc-500">Rather talk it through?</span>
            <a href={telHref}>
              <Button variant="outline"
                className="h-12 w-full gap-2 px-6 text-base font-bold sm:w-auto">
                <Phone className="h-4 w-4" /> {c.phone}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-brand-400 ${mono}`}>
            How it works
          </p>
          <h2 className="mt-3 max-w-xl text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three steps. No dealership, no haggling.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: ClipboardList, n: "01", t: "Tell us about the car",
                b: "Year, make, model, and how rough it is. About a minute. No VIN hunting and no account to create." },
              { icon: BadgeDollarSign, n: "02", t: "Get your real number",
                b: "A guaranteed cash offer priced from live scrap weight, the catalytic converter and parts that still sell." },
              { icon: Truck, n: "03", t: "We collect it and pay you",
                b: "Pick a time that suits you. We come to your driveway anywhere in DFW, hand you the cash, and tow it free." },
            ].map(({ icon: Icon, n, t, b }) => (
              <div key={n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <div className="flex items-center justify-between">
                  <Icon className="h-7 w-7 text-brand-400" />
                  <span className={`text-sm font-semibold text-brand-400/80 ${mono}`}>{n}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* what we buy */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          What we buy
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">
          If it has four wheels and a title problem, a dead engine or a caved-in
          front end, it is still worth money. We buy cars, trucks, vans and SUVs
          in any condition.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [Wrench, "Wrecked and collision cars", "Front, rear or side damage, deployed airbags, insurance write-offs."],
            [Truck, "Cars that will not start", "Seized engines, blown transmissions, dead for years in the driveway."],
            [FileText, "No title, lost title", "We handle Texas paperwork daily and will tell you what your case needs."],
            [ShieldCheck, "Flood and fire damage", "Water and smoke do not stop a car being worth scrap and parts."],
            [BadgeDollarSign, "High-mileage trade-ins", "Worth more to us than the dealer offered you on trade."],
            [MapPin, "Abandoned on your property", "Tenants and neighbours leave cars behind. We remove them."],
          ].map(([Icon, t, b]) => {
            const I = Icon as typeof Truck;
            return (
              <div key={t as string} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                <I className="h-6 w-6 text-brand-600" />
                <h3 className="mt-3 font-bold">{t as string}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{b as string}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* testimonials — real customers carried over from junkerz.com */}
      <section className="border-y border-zinc-100 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
            What DFW sellers say
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.slice(0, 3).map((t) => (
              <figure key={t.name} className="rounded-2xl border border-zinc-200 bg-white p-6">
                <Quote className="h-6 w-6 text-brand-600" />
                <blockquote className="mt-3 text-[15px] leading-relaxed text-zinc-700">
                  {t.text}
                </blockquote>
                <figcaption className={`mt-4 text-sm font-bold text-zinc-900 ${mono}`}>
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* reassurance */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="rounded-3xl bg-brand-600 px-8 py-12 text-white md:px-14 md:py-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-brand-100">
                <ShieldCheck className="h-5 w-5" />
                <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${mono}`}>
                  No title? Dead motor? Still worth cash.
                </span>
              </div>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                We buy cars other places turn away.
              </h2>
              <p className="mt-3 text-brand-50">
                A dead car still carries real value in scrap metal, the catalytic
                converter and reusable parts. That is exactly what we price and pay for.
              </p>
            </div>
            <Link href="/quote" className="w-full md:w-auto">
              <Button className="h-14 w-full gap-2 bg-white px-8 text-base font-bold text-brand-700 hover:bg-brand-50 md:w-auto">
                Get my offer <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* service area */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Where we tow from
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">
          We cover Dallas–Fort Worth and about two hours around it, from
          Gainesville down to Ennis and from Weatherford across to Greenville.
          Towing is free everywhere on this list.
        </p>
        <div className="mt-7 flex flex-wrap gap-2">
          {CITIES.map((x) => (
            <Link
              key={x.slug}
              href={`/cash-for-junk-cars/${x.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-brand-600 hover:text-brand-700"
            >
              {x.name}
            </Link>
          ))}
        </div>
      </section>

      {/* faq */}
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <h2 className="text-center text-3xl font-extrabold tracking-tight">
          Good to know
        </h2>
        <div className="mt-8 divide-y divide-zinc-200">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {q}
                <span className={`text-2xl leading-none text-brand-600 transition-transform group-open:rotate-45 ${mono}`}>
                  +
                </span>
              </summary>
              <p className="mt-3 text-zinc-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <SiteFooter phone={c.phone} />
      <StickyMobileBar />
    </main>
  );
}

export function SiteFooter({ phone }: { phone?: string }) {
  const p = phone || SITE.phone;
  const telHref = `tel:+1${p.replace(/\D/g, "")}`;
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-extrabold text-zinc-900">
              <Logo height={28} />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Buying junk, wrecked and non-running cars across Dallas–Fort Worth
              since {SITE.founded}. Free towing, cash at pickup.
            </p>
            <a href={telHref} className={`mt-4 inline-flex items-center gap-1.5 font-bold text-zinc-900 hover:text-brand-700 ${mono}`}>
              <Phone className="h-4 w-4" /> {p}
            </a>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900">Sell your car</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><Link href="/quote" className="hover:text-brand-700">Get an instant offer</Link></li>
              <li><Link href="/junk-cars" className="hover:text-brand-700">Wrecked &amp; junk cars</Link></li>
              <li><Link href="/not-running" className="hover:text-brand-700">Cars that will not start</Link></li>
              <li><Link href="/unwanted-cars" className="hover:text-brand-700">Unwanted cars</Link></li>
              <li><Link href="/carro-viejos" className="hover:text-brand-700">Español · Carros viejos</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900">Company</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              <li><Link href="/about-us" className="hover:text-brand-700">About us</Link></li>
              <li><Link href="/contact-us" className="hover:text-brand-700">Contact us</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-brand-700">Privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-brand-700">Terms of service</Link></li>
              <li><Link href="/buyers/login" className="hover:text-brand-700">Salvage yard login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-900">Popular areas</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600">
              {CITIES.slice(0, 8).map((x) => (
                <li key={x.slug}>
                  <Link href={`/cash-for-junk-cars/${x.slug}`} className="hover:text-brand-700">
                    Junk cars in {x.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {SITE.legal}. {SITE.street}, {SITE.city}, {SITE.state} {SITE.postal}.</span>
          <a href={`mailto:${SITE.email}`} className="underline hover:text-zinc-800">{SITE.email}</a>
        </div>
      </div>
    </footer>
  );
}
