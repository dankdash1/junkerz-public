import type { Metadata } from "next";
import { Quote } from "lucide-react";
import PageShell, { BottomCTA } from "@/components/PageShell";
import { SITE, TESTIMONIALS } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata: Metadata = {
  title: "About Junkerz | Selling Your Junk Car in Dallas–Fort Worth",
  description:
    "Junkerz connects junk-car sellers with buyers online across Dallas–Fort Worth. Get an instant quote at Junkerz.com or call 817-420-9180.",
  alternates: { canonical: `${SITE.url}/about-us` },
};

export default function AboutUs() {
  return (
    <PageShell
      eyebrow="About us"
      title="Connecting junk-car sellers and buyers online"
      lede="Junkerz is an online marketplace serving Dallas–Fort Worth. We connect people selling old, wrecked and unwanted vehicles with buyers and help coordinate pickup through assigned partners. We do not operate a public storefront or walk-in yard."
    >
      <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Who we are
          </h2>
          <p className="mt-3">
            Sellers want a clear offer and a convenient way to arrange the sale.
            Buyers need accurate vehicle information. Junkerz brings both sides
            together online, starting with an instant quote.
          </p>
          <p className="mt-3">
            Tell us the condition of your car, truck, van or SUV, including whether
            it runs. The vehicle details help buyers evaluate it and help the
            assigned pickup partner prepare for collection.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Making the process easy for you
          </h2>
          <p className="mt-3">
            Start your instant quote online or call {SITE.phone} for help. Review
            your offer and pickup arrangements before proceeding. Once a partner
            is assigned, confirm who will contact you and when pickup will happen.
          </p>
          <p className="mt-3">
            The sale starts online; there is no yard to visit. Pickup availability
            depends on the vehicle location and the assigned partner. Tell us about
            access restrictions or a removal deadline when requesting your quote.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            In our customers&apos; words
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <Quote className="h-5 w-5 text-brand-600" />
                <blockquote className="mt-2.5 text-[15px] leading-relaxed">{t.text}</blockquote>
                <figcaption className={`mt-3 text-sm font-bold text-zinc-900 ${mono}`}>
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-14 -mx-5">
        <BottomCTA
          heading="Ready when you are"
          body="Start a quote online or call and talk it through. Either way the towing is free."
        />
      </div>
    </PageShell>
  );
}
