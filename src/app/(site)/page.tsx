import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/PageShell";
import Link from "next/link";
import StickyMobileBar from "@/components/StickyMobileBar";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import type { Metadata } from "next";
import {
  Truck, BadgeDollarSign, Phone, ClipboardList, ArrowRight,
  ShieldCheck, MapPin, Quote, Wrench, FileText, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE, TESTIMONIALS, CITIES, PICKUPS_LIVE } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

export const metadata: Metadata = {
  title: "Cash for Junk Cars in Dallas–Fort Worth | Junkerz",
  description:
    "Connect with junk-car buyers across Dallas–Fort Worth through Junkerz. Get an instant quote online and arrange pickup with an assigned partner. Call 817-420-9180.",
  alternates: {
    canonical: SITE.url,
    languages: { "en-US": SITE.url, "es-US": `${SITE.url}/carro-viejos`, "x-default": SITE.url },
  },
  openGraph: {
    title: "Cash for Junk Cars in Dallas–Fort Worth",
    description:
      "An online marketplace connecting junk-car sellers and buyers in DFW. Start an instant quote and arrange pickup with your assigned partner.",
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
    "Connect with junk-car buyers across Dallas–Fort Worth. Tell us about your vehicle, get an instant quote, and confirm pickup arrangements with your assigned partner.",
  hero_cta: "See what it's worth",
  phone: SITE.phone,
  sample_offer_amount: "620",
  sample_offer_vehicle: "2012 Toyota Camry · Arlington, TX",
};

const FAQ: [string, string][] = [
  ["Do I need the title to sell my car?",
   "Tell us if the title is missing. You must own the vehicle or have documented authority to sell it. Your assigned buyer must confirm acceptable ownership documents before pickup; registration and photo ID are not a blanket substitute for a title."],
  ["Is the towing really free?",
   "Towing is free for a confirmed pickup in our service area. Tell us about gates, missing wheels or difficult access before scheduling. Your guaranteed offer holds when the vehicle, condition, major parts and ownership details match your description. Any difference must be explained before you agree to a revised offer."],
  ["How far out do you come?",
   "Request a quote across Dallas–Fort Worth and surrounding North Texas, including Terrell, Midlothian, Ennis, Gainesville, Weatherford and Greenville. Your exact address and the assigned partner's availability determine whether and when pickup can be confirmed."],
  ["My car does not run at all. Is it still worth something?",
   "Almost always. The value sits in the scrap weight, the catalytic converter and the reusable parts, none of which need the engine to start. You can get a quote for a non-running car through the marketplace."],
  ["How fast can you pick it up?",
   PICKUPS_LIVE
     ? "Pickup timing depends on your location and the assigned pickup partner. Confirm the date and time before making arrangements. Tell us about any apartment or city tow deadline when requesting your quote."
     : "We are not scheduling pickups yet. Get your offer now and we will contact you when pickups start. We cannot promise a pickup date while we are opening."],
  ["How do I get paid?",
   "The assigned independent buyer purchases your vehicle and is responsible for paying you at pickup. The pickup partner collects it and may deliver payment for the buyer. Confirm the buyer's name, the agreed amount and payment method before collection. Contact Junkerz if you need help with the offer, payment or pickup."],
  ["Is my offer guaranteed?",
   "Yes, when the vehicle, condition, major parts and ownership details match what you told us. A missing part, undisclosed damage or different ownership details can change the offer or prevent the sale. The buyer must explain any difference before you agree to a revised offer, and you can decline."],
  ["What kinds of vehicles can I sell?",
   "Cars, trucks, vans and SUVs. Wrecked, flooded, burned, stripped, seized, or simply worn out. Buyers also accept vehicles that have been sitting for years and will not move under their own power."],
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
        "@type": "Organization",
        "@id": `${SITE.url}/#business`,
        name: SITE.legal,
        description:
          "Junkerz is an online marketplace connecting junk-car sellers with buyers across Dallas–Fort Worth. Start an instant quote online; pickup is coordinated with the assigned partner.",
        url: SITE.url,
        telephone: SITE.phone,
        email: SITE.email,
        foundingDate: SITE.founded,
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

      <SiteHeader phone={c.phone} />

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
          <p className="mx-auto mt-5 max-w-xl text-sm text-zinc-600">
            Junkerz generates your online offer and helps coordinate your sale.
            Your assigned independent buyer purchases the vehicle and pays you;
            the pickup partner collects it. We do not have a public storefront.
          </p>
          <p className="mx-auto mt-7 max-w-xl text-lg text-zinc-600">
            {c.hero_subtitle}
          </p>

          <ul className="mx-auto mt-8 grid max-w-2xl gap-3 text-[15px] text-zinc-700 sm:grid-cols-2">
            {[
              [Truck, "Free towing for confirmed pickups"],
              [BadgeDollarSign, "Your buyer pays at collection"],
              [FileText, "Ownership documents checked before pickup"],
              [Clock, PICKUPS_LIVE ? "Pickup timing confirmed with your partner" : "Opening soon — pickups have not started"],
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
                b: "A guaranteed offer when the vehicle, condition, major parts and ownership details match your description. Any difference is explained before you agree to a revised offer." },
              { icon: Truck, n: "03", t: PICKUPS_LIVE ? "Confirm pickup and payment" : "We contact you when pickups start",
                b: PICKUPS_LIVE
                  ? "Confirm a pickup window and payment details. Your assigned independent buyer purchases and pays for the vehicle; your pickup partner collects it with free towing."
                  : "Save your offer now. We are not scheduling pickups yet. We will contact you before arranging collection and payment." },
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

      {/* vehicles sellers can quote */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
          Vehicles you can sell
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">
          A dead engine or a caved-in front end can still leave value in scrap and
          reusable parts. Request an offer for your car, truck, van or SUV.
          You must own it or have documented authority to sell it.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [Wrench, "Wrecked and collision cars", "Front, rear or side damage, deployed airbags, insurance write-offs."],
            [Truck, "Cars that will not start", "Seized engines, blown transmissions, dead for years in the driveway."],
            [FileText, "Missing or lost title", "Tell us before scheduling. Your buyer must confirm acceptable ownership documents before pickup."],
            [ShieldCheck, "Flood and fire damage", "Water and smoke do not stop a car being worth scrap and parts."],
            [BadgeDollarSign, "High-mileage trade-ins", "Compare your offer with a trade-in using the vehicle's actual condition and remaining parts."],
            [MapPin, "Vehicle left on your property", "Being on your property does not make it yours to sell. Documented ownership or legal authority is required."],
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
        <p className="mt-5 max-w-2xl text-sm text-zinc-600">
          For an abandoned vehicle, Texas has a separate authority-to-dispose process.
          Review the <a href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/abandoned-vehicles" className="font-semibold text-brand-700 underline">TxDMV abandoned-vehicle guidance</a>{" "}
          before requesting removal of a vehicle you do not own.
        </p>
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
                  Dead motor? Damaged car? Check its value.
                </span>
              </div>
              <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                Find buyers for cars other places turn away.
              </h2>
              <p className="mt-3 text-brand-50">
                A dead car still carries real value in scrap metal, the catalytic
                converter and reusable parts. Those are the details used to price your offer.
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
          Pickup service area
        </h2>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Request pickup across Dallas–Fort Worth and surrounding North Texas,
          including Terrell and Midlothian. Share the exact vehicle address and
          access details so your assigned partner can confirm availability.
          Towing is free for confirmed pickups in our service area.
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
