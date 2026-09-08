import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Phone, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader, SiteFooter } from "@/components/PageShell";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import { SITE, CITIES, cityBySlug } from "@/lib/site";

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
      `Junkerz buys junk, wrecked and non-running cars in ${c.name}, ${c.county}. Guaranteed offer in about a minute, free towing, cash at pickup. Call ${SITE.phone}.`,
    alternates: { canonical: `${SITE.url}/cash-for-junk-cars/${c.slug}` },
    openGraph: {
      title: `Cash for Junk Cars in ${c.name}, TX | Junkerz`,
      description: `Free towing across ${c.name} and ${c.county}. Cash handed over at pickup.`,
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

  const others = CITIES.filter((x) => x.slug !== c.slug).slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Cash for junk cars in ${c.name}, TX`,
        serviceType: "Junk car buying and removal",
        provider: {
          "@type": "AutoDealer",
          name: SITE.legal,
          telephone: SITE.phone,
          address: {
            "@type": "PostalAddress",
            streetAddress: SITE.street,
            addressLocality: SITE.city,
            addressRegion: SITE.state,
            postalCode: SITE.postal,
            addressCountry: SITE.country,
          },
        },
        areaServed: {
          "@type": "City",
          name: `${c.name}, TX`,
          containedInPlace: { "@type": "AdministrativeArea", name: c.county },
        },
        offers: { "@type": "Offer", priceCurrency: "USD", description: "Free towing, cash paid at pickup" },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Service areas", item: `${SITE.url}/#areas` },
          { "@type": "ListItem", position: 3, name: c.name, item: `${SITE.url}/cash-for-junk-cars/${c.slug}` },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />

      {/* hero with the quote form, same as the homepage */}
      <section className="border-b border-zinc-100">
        <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 py-12 md:grid-cols-[1.05fr_.95fr] md:py-16">
          <div>
            <p className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 ${mono}`}>
              <MapPin className="h-3.5 w-3.5" /> {c.name} · {c.county}
            </p>
            <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl">
              Cash for junk cars in {c.name}, TX
            </h1>
            <p className="mt-5 text-lg text-zinc-600">
              Junkerz buys junk, wrecked and non-running vehicles across {c.name} and
              the rest of {c.county}. Get a guaranteed cash offer in about a minute,
              keep the towing free, and take the money when we collect the car.
            </p>
            <p className="mt-4 text-[17px] leading-relaxed text-zinc-700">{c.note}</p>
            <div className="mt-6">
              <a href={SITE.phoneHref}>
                <Button variant="outline" className="h-12 gap-2 px-6 text-base font-bold">
                  <Phone className="h-4 w-4" /> {SITE.phone}
                </Button>
              </a>
            </div>
          </div>
          <div className="md:sticky md:top-24">
            <HeroQuoteForm />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-5 py-14">
        <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              What we buy in {c.name}
            </h2>
            <p className="mt-3">
              Condition is not a barrier. If the vehicle is sitting in {c.name} and you
              want it gone, it almost certainly has value in scrap weight, the catalytic
              converter and the parts that still sell.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                "Wrecked cars, deployed airbags and insurance total-losses",
                "Vehicles that will not start, will not move, or have no engine",
                "Cars with no title, or where the title was lost years ago",
                "Flood, hail, storm and fire damaged vehicles",
                "Trucks, vans and SUVs, not just cars",
                `Vehicles abandoned on your property anywhere in ${c.county}`,
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
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
              Towing costs you nothing. It is not deducted from the offer and it is not
              added at the kerb. While we are in the area we also collect from{" "}
              {c.near.slice(0, -1).join(", ")} and {c.near[c.near.length - 1]}, so if
              your car is just outside {c.name} the answer is still yes.
            </p>
            <p className="mt-3">
              The vehicle does not need to run, roll or hold air. Our drivers carry the
              equipment to load a car that cannot move on its own, whether it is on a
              driveway, on grass or up on blocks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              How selling works
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                ["Tell us about the car", "Year, make, model and roughly what is wrong with it. About a minute, no account needed."],
                ["Get a guaranteed number", "Priced from live scrap values, the catalytic converter and the parts still worth reselling."],
                [`We come to ${c.name}`, "You pick the window. We turn up, hand over the cash, do the paperwork and tow it away free."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-600 text-sm font-bold text-white ${mono}`}>
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
              Often, no. In many {c.county} cases we can complete the purchase with your
              vehicle registration and a photo ID instead of the title. Tell us your
              situation while you are getting the quote and we will say exactly what is
              needed before anyone drives out to you. We handle this paperwork every day.
            </p>
          </section>
        </div>

        <div className="mt-12 rounded-3xl bg-emerald-600 px-8 py-10 text-white">
          <h2 className="text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
            Get your {c.name} offer today
          </h2>
          <p className="mt-3 max-w-xl text-emerald-50">
            One minute for a guaranteed number. Free towing across {c.name} and{" "}
            {c.county}, cash in your hand at pickup.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/quote">
              <Button className="h-14 w-full gap-2 bg-white px-8 text-base font-bold text-emerald-700 hover:bg-emerald-50 sm:w-auto">
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
            Other areas we cover
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {others.map((x) => (
              <Link key={x.slug} href={`/cash-for-junk-cars/${x.slug}`}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:border-emerald-600 hover:text-emerald-700">
                {x.name}
              </Link>
            ))}
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
