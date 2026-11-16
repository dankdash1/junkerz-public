import type { Metadata } from "next";
import StickyMobileBar from "@/components/StickyMobileBar";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Phone, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/PageShell";
import { SITE, CITIES, cityBySlug } from "@/lib/site";
import { CITY_GUIDES, LOCAL_SOURCES } from "@/lib/local-guides";
import { townHref } from "@/lib/service-areas";

const mono = "font-[family-name:var(--font-geist-mono)]";

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city } = await params;
  const c = cityBySlug(city);
  if (!c) return {};
  return {
    title: `Cash for Junk Cars in ${c.name}, TX | Free Towing`,
    description:
      `Sell a junk car in ${c.name} through Junkerz's independent buyers. Local pickup preparation, ownership requirements and address-confirmed towing. Call ${SITE.phone}.`,
    alternates: { canonical: `${SITE.url}/cash-for-junk-cars/${c.slug}` },
    openGraph: {
      title: `Cash for Junk Cars in ${c.name}, TX | Junkerz`,
      description: `Request a ${c.name} offer and confirm pickup with the assigned partner. Your guaranteed offer holds when the vehicle and ownership details are correct.`,
      url: `${SITE.url}/cash-for-junk-cars/${c.slug}`,
      type: "website",
    },
  };
}

export default async function CityPage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city } = await params;
  const c = cityBySlug(city);
  if (!c) notFound();

  const local = CITY_GUIDES[c.slug];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Cash for junk cars in ${c.name}, TX`,
        serviceType: "Online marketplace connecting vehicle sellers with independent buyers and pickup partners",
        provider: {
          "@type": "Organization",
          "@id": `${SITE.url}/#business`,
          name: SITE.legal,
          telephone: SITE.phone,
          url: SITE.url,
        },
        areaServed: {
          "@type": "City",
          name: `${c.name}, TX`,
          containedInPlace: { "@type": "State", name: "Texas" },
        },
        offers: { "@type": "Offer", priceCurrency: "USD", description: "Guaranteed offer when vehicle and ownership details are accurate. The assigned buyer buys and pays; pickup and included towing are confirmed by address with the assigned partner." },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Service areas", item: `${SITE.url}/service-areas` },
          { "@type": "ListItem", position: 3, name: c.name, item: `${SITE.url}/cash-for-junk-cars/${c.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white pb-20 text-zinc-900 md:pb-0">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      {/* Each city starts the same quote flow as the homepage. */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-8 text-center md:grid-cols-2 md:gap-12 md:py-14 md:text-left">
          <div>
            <p className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 ${mono}`}>
              <MapPin className="h-3.5 w-3.5" /> {c.name}, Texas
            </p>
            <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
              Cash for junk cars in {c.name}, TX
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600">
              Junkerz connects sellers of junk, wrecked and non-running vehicles
              with independent buyers in the {c.name} area. Your assigned buyer buys
              the vehicle and pays you; your pickup partner confirms collection
              and included towing for your address.
            </p>
          </div>
          <HeroQuoteForm />
          <div className="md:col-span-2">
            <p className="mx-auto max-w-3xl text-center text-[17px] leading-relaxed text-zinc-700">Your guaranteed offer holds when the vehicle condition, missing parts and ownership details match what you provided. If they differ, the buyer explains any revised offer before you decide to sell. Confirm the pickup window and payment method before the handoff. Junkerz operates online; there is no public yard to visit.</p>
            <p className="mt-4 text-center text-sm text-zinc-600">
              Prefer to talk?{" "}
              <a href={SITE.phoneHref} className="inline-flex items-center gap-1.5 font-bold text-brand-700 underline underline-offset-4">
                <Phone className="h-4 w-4" /> {SITE.phone}
              </a>
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
          <section aria-labelledby="local-pickup">
            <p className={`text-xs font-bold uppercase tracking-widest text-brand-700 ${mono}`}>{c.name} pickup planning</p>
            <h2 id="local-pickup" className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">{local.heading}</h2>
            <p className="mt-3 font-medium text-zinc-900">{local.geography}</p>
            {local.advice.map((paragraph) => <p key={paragraph} className="mt-3">{paragraph}</p>)}
            <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50 p-5">
              <h3 className="font-bold text-zinc-900">Before your {c.name} pickup</h3>
              <p className="mt-2">{local.preparation}</p>
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              Local geography: {local.sources.map((key, index) => <span key={key}>{index > 0 && "; "}<a className="underline underline-offset-2" href={LOCAL_SOURCES[key].url}>{LOCAL_SOURCES[key].label}</a></span>)}.
              {" "}These sources describe the area; pickup availability is confirmed separately by your assigned partner.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              Vehicles you can sell in {c.name}
            </h2>
            <p className="mt-3">
              You can request an offer for damaged or non-running vehicles. The buyer
              considers the car's condition, remaining components and ownership
              documents before confirming a purchase.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                "Wrecked cars, deployed airbags and insurance total-losses",
                "Vehicles that will not start, will not move, or have no engine",
                "Cars with a lost title, after the buyer confirms a lawful documentation path",
                "Flood, hail, storm and fire damaged vehicles",
                "Trucks, vans and SUVs, not just cars",
                "Vehicles you own or have documented legal authority to sell",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              Free towing in {c.name} and nearby
            </h2>
            <p className="mt-3">
              Towing is included in the confirmed pickup arrangement. Describe access,
              missing wheels and other loading needs in advance so the partner can
              confirm the plan. You can also request an address check near{" "}
              {c.near.slice(0, -1).join(", ")} and {c.near[c.near.length - 1]}.
              Confirm availability at your address with the assigned pickup partner.
            </p>
            <p className="mt-3">
              Tell your assigned pickup partner if the vehicle cannot run or roll,
              has flat tires, or is on grass or blocks. They will need those details
              to confirm access and arrange suitable loading equipment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              How selling works
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                ["Tell us about the car", "Year, make, model and roughly what is wrong with it. About a minute, no account needed."],
                ["Get a guaranteed number", "The offer holds when the vehicle condition, missing parts and ownership details match your description. Any mismatch is explained before you decide whether to accept a revised offer."],
                [`Arrange pickup in ${c.name}`, "Your assigned buyer purchases the vehicle and pays you. The assigned pickup partner collects it under the confirmed towing arrangement. Agree on the window, paperwork and payment method before collection."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white ${mono}`}>
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-zinc-900">{t}</h3>
                    <p className="mt-1 text-zinc-600">{b}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              Do I need the title in Texas?
            </h2>
            <p className="mt-3">
              Tell the buyer whether you have the title, whether a lien exists and whose
              name appears on the ownership documents. A missing title requires review;
              registration and photo ID alone do not automatically make a sale lawful.
              The buyer must confirm the required documents before pickup. See{" "}
              <a href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle" className="font-semibold text-brand-700 underline">TxDMV's vehicle sale guidance</a>.
            </p>
            <p className="mt-3">
              A car left on your property is not automatically yours to sell. Certain
              vehicles require Texas's authority-to-dispose process or other legal
              authority before removal or sale. Review the{" "}
              <a href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/abandoned-vehicles" className="font-semibold text-brand-700 underline">TxDMV abandoned-vehicle process</a>{" "}
              and resolve ownership before arranging pickup.
            </p>
            <p className="mt-3">If an offer, pickup or payment does not match the confirmed arrangement, contact Junkerz at <a href={SITE.phoneHref} className="font-semibold text-brand-700 underline">{SITE.phone}</a> so we can help coordinate with the assigned buyer or partner.</p>
          </section>
        </div>

        <div className="mt-12 rounded-3xl bg-brand-600 px-8 py-10 text-white">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
            Get your {c.name} offer today
          </h2>
          <p className="mt-3 max-w-xl text-brand-50">
            Start with your year, make, model and condition. Your guaranteed offer holds
            when the vehicle and ownership details are accurate. Confirm pickup at your
            address and the buyer's payment method before collection.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote">
              <Button className="h-14 w-full gap-2 bg-white px-8 text-base font-bold text-brand-700 hover:bg-brand-50 sm:w-auto">
                Get my offer <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href={SITE.phoneHref}>
              <Button variant="outline"
                className="h-14 w-full gap-2 border-white/40 bg-transparent px-6 text-base font-bold text-white hover:bg-white/10 sm:w-auto">
                <Phone className="h-4 w-4" /> {SITE.phone}
              </Button>
            </a>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">
            Near {c.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.near.map((name) => (
              <Link key={name} href={townHref(name)}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:border-brand-600 hover:text-brand-700">
                {name}
              </Link>
            ))}
          </div>
          <p className="mt-5 text-sm"><Link href="/service-areas" className="font-semibold text-brand-700 underline underline-offset-4">Browse DFW and outer-town pickup requests</Link>. Every address and collection window needs partner confirmation.</p>
        </section>
      </div>

      <SiteFooter />
      <StickyMobileBar />
    </main>
  );
}
