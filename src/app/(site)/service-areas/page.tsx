import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import HeroQuoteForm from "@/components/HeroQuoteForm";
import { SiteHeader, SiteFooter } from "@/components/PageShell";
import StickyMobileBar from "@/components/StickyMobileBar";
import { SITE } from "@/lib/site";
import { AREA_DIRECTORY_SOURCES, SERVICE_AREA_TOWNS, townAnchor, townGuide } from "@/lib/service-areas";

export const metadata: Metadata = {
  title: "DFW & North Texas Junk Car Pickup Areas | Junkerz",
  description: "Find DFW and outer North Texas towns, including Terrell, Midlothian, Wilmer and Seagoville. Request an offer and confirm pickup availability for your address.",
  alternates: { canonical: `${SITE.url}/service-areas` },
  openGraph: {
    title: "DFW & North Texas pickup requests | Junkerz",
    description: "Town guides and address checks across DFW and surrounding North Texas. Every pickup needs confirmation with the assigned partner.",
    url: `${SITE.url}/service-areas`,
    type: "website",
  },
};

const letters = Array.from(new Set(SERVICE_AREA_TOWNS.map((name) => name[0])));

export default function ServiceAreasPage() {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Service areas", item: `${SITE.url}/service-areas` },
    ],
  };

  return (
    <main className="min-h-screen bg-white pb-20 text-zinc-900 md:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <SiteHeader />
      <section className="border-b border-zinc-100">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-2 md:py-16">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700"><MapPin className="h-4 w-4" /> DFW & surrounding North Texas</p>
            <h1 className="mt-4 text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Check pickup at your address</h1>
            <p className="mt-5 text-lg leading-relaxed text-zinc-600">From Dallas and Fort Worth to Terrell, Midlothian and communities farther out, start with your vehicle details. Junkerz connects you with independent buyers and pickup partners. The assigned buyer buys your car and pays you.</p>
            <p className="mt-4 text-base leading-relaxed text-zinc-700">A town listing is a place to start an address check. It does not guarantee a buyer, pickup slot or towing arrangement. Confirm the exact location, vehicle condition, access and included towing with the assigned partner before making plans.</p>
            <a href={SITE.phoneHref} className="mt-5 inline-flex items-center gap-2 font-bold text-brand-700 underline underline-offset-4"><Phone className="h-4 w-4" /> {SITE.phone}</a>
          </div>
          <HeroQuoteForm />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-12">
        <section className="grid gap-6 md:grid-cols-3" aria-label="Prepare an address check">
          <div className="rounded-2xl border border-zinc-200 p-6"><h2 className="text-lg font-bold">Use the car's actual location</h2><p className="mt-3 leading-relaxed text-zinc-600">A mailing city or ZIP code may cover places outside city limits. Share the pickup address during scheduling, including the correct entrance for a repair shop, storage lot or rural property.</p></div>
          <div className="rounded-2xl border border-zinc-200 p-6"><h2 className="text-lg font-bold">Describe access and condition</h2><p className="mt-3 leading-relaxed text-zinc-600">Mention missing wheels or parts, locked gates, garage clearance and whether the car rolls and steers. Your guaranteed offer holds when vehicle and ownership details match your description.</p></div>
          <div className="rounded-2xl border border-zinc-200 p-6"><h2 className="text-lg font-bold">Confirm before collection</h2><p className="mt-3 leading-relaxed text-zinc-600">Agree on the pickup window, paperwork and buyer's payment method. Outer-area requests may need additional coordination. Junkerz operates online and has no public yard or local offices to visit.</p></div>
        </section>

        <section className="mt-14" aria-labelledby="town-directory">
          <h2 id="town-directory" className="text-3xl font-extrabold tracking-tight">Find your town</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-zinc-600">Linked towns have a guide with pickup preparation and local geography. Other entries use the address-check process above. This directory includes DFW, smaller surrounding communities and outer North Texas towns; if your location is missing, call with the car's actual location.</p>
          <nav aria-label="Town directory letters" className="my-6 flex flex-wrap gap-2">
            {letters.map((letter) => <a key={letter} href={`#letter-${letter.toLowerCase()}`} className="grid h-10 w-10 place-items-center rounded-lg border border-zinc-200 font-bold text-brand-700 hover:bg-brand-50">{letter}</a>)}
          </nav>
          <div className="space-y-8">
            {letters.map((letter) => (
              <section key={letter} id={`letter-${letter.toLowerCase()}`} className="scroll-mt-24 border-t border-zinc-200 pt-5" aria-labelledby={`heading-${letter}`}>
                <h3 id={`heading-${letter}`} className="text-2xl font-extrabold text-brand-700">{letter}</h3>
                <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {SERVICE_AREA_TOWNS.filter((name) => name[0] === letter).map((name) => {
                    const city = townGuide(name);
                    return <li key={name} id={townAnchor(name)} className="scroll-mt-24 text-sm leading-relaxed">
                      {city ? <Link href={`/cash-for-junk-cars/${city.slug}`} className="font-semibold text-brand-700 underline underline-offset-4">{name} pickup guide</Link> : <span className="text-zinc-700">{name}</span>}
                    </li>;
                  })}
                </ul>
              </section>
            ))}
          </div>
        </section>

        <aside className="mt-12 rounded-2xl bg-zinc-50 p-6 text-sm leading-relaxed text-zinc-600">
          <h2 className="font-bold text-zinc-900">About this directory</h2>
          <p className="mt-2">Town names and geography are informed by public regional and transportation sources. Those sources do not establish Junkerz pickup availability. Each vehicle and address is reviewed separately; these entries are not branches or storefronts.</p>
          <ul className="mt-3 space-y-1">{AREA_DIRECTORY_SOURCES.map((source) => <li key={source.url}><a href={source.url} className="underline underline-offset-2">{source.label}</a></li>)}</ul>
          <p className="mt-4">For help with an offer, payment or pickup, <Link href="/contact-us" className="font-semibold text-brand-700 underline">contact Junkerz</Link>. We can coordinate with the assigned buyer or pickup partner.</p>
        </aside>
      </div>
      <SiteFooter />
      <StickyMobileBar />
    </main>
  );
}
