import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageShell from "@/components/PageShell";
import { SITE, CITIES } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata: Metadata = {
  title: "Contact Junkerz | Sell Your Car for Cash Today in DFW",
  description:
    "Call Junkerz on 817-420-9180 or start an online quote. We buy junk and wrecked cars across Dallas–Fort Worth with free towing and cash at pickup.",
  alternates: { canonical: `${SITE.url}/contact-us` },
};

export default function ContactUs() {
  return (
    <PageShell
      eyebrow="Contact us"
      title="Sell your car with Junkerz today"
      lede="Two ways to reach us, and both end the same way. A guaranteed cash number for your vehicle and a free tow anywhere in Dallas–Fort Worth."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <a href={SITE.phoneHref}
           className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-brand-600">
          <Phone className="h-6 w-6 text-brand-600" />
          <h2 className="mt-3 font-bold text-zinc-900">Call us</h2>
          <p className={`mt-1 text-xl font-extrabold text-zinc-900 ${mono}`}>{SITE.phone}</p>
          <p className="mt-2 text-sm text-zinc-600">
            A person answers. Tell us what you have and we will price it on the call.
          </p>
        </a>

        <a href={`mailto:${SITE.email}`}
           className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:border-brand-600">
          <Mail className="h-6 w-6 text-brand-600" />
          <h2 className="mt-3 font-bold text-zinc-900">Email us</h2>
          <p className="mt-1 text-lg font-bold text-zinc-900">{SITE.email}</p>
          <p className="mt-2 text-sm text-zinc-600">
            Send the year, make, model and a photo or two, and we will come back with a number.
          </p>
        </a>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <MapPin className="h-6 w-6 text-brand-600" />
          <h2 className="mt-3 font-bold text-zinc-900">Where we are</h2>
          <p className="mt-1 text-zinc-700">
            {SITE.street}<br />{SITE.city}, {SITE.state} {SITE.postal}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            You do not need to come to us. We come to the car.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <Clock className="h-6 w-6 text-brand-600" />
          <h2 className="mt-3 font-bold text-zinc-900">Hours</h2>
          <p className="mt-1 text-zinc-700">Monday to Saturday, 8am to 7pm</p>
          <p className="mt-2 text-sm text-zinc-600">
            Online quotes run around the clock. Pickups are scheduled during these hours.
          </p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50 p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">
          Fastest way: get the number first
        </h2>
        <p className="mt-2 text-zinc-700">
          The online quote asks a handful of questions about the car and gives you a
          guaranteed offer at the end. It takes about a minute and does not commit you
          to anything.
        </p>
        <Link href="/quote" className="mt-5 inline-block">
          <Button className="h-13 gap-2 px-7 text-base font-bold">
            Start my quote <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">
          Areas we tow from
        </h2>
        <p className="mt-2 text-zinc-600">
          Free towing across Dallas–Fort Worth and about two hours around it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CITIES.map((x) => (
            <Link key={x.slug} href={`/cash-for-junk-cars/${x.slug}`}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:border-brand-600 hover:text-brand-700">
              {x.name}
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
