import type { Metadata } from "next";
import { Quote } from "lucide-react";
import PageShell, { BottomCTA } from "@/components/PageShell";
import { SITE, TESTIMONIALS } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";

export const metadata: Metadata = {
  title: "About Junkerz | Selling Your Junk Car in Dallas–Fort Worth",
  description:
    "Junkerz has been buying junk cars around Dallas–Fort Worth since 2015. Free towing, fast paperwork and cash the day we collect. Call 817-420-9180.",
  alternates: { canonical: `${SITE.url}/about-us` },
};

export default function AboutUs() {
  return (
    <PageShell
      eyebrow="About us"
      title="Your salvage yard for selling junk cars"
      lede="Junkerz is a Dallas–Fort Worth company that buys old, wrecked and unwanted vehicles. Our goal is simple. Pay you properly for the car nobody else wanted, and get it off your property the same week."
    >
      <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Who we are
          </h2>
          <p className="mt-3">
            We have been buying junk cars from people around the DFW metroplex since{" "}
            {SITE.founded}. In that time we have learned that most sellers are not
            chasing the last dollar. They want a straight number, someone who turns up
            when they said they would, and the car gone.
          </p>
          <p className="mt-3">
            No matter the condition, we can make use of the vehicle and give you cash
            in exchange. We tow cars, trucks, vans and SUVs that no longer work, and
            we take the ones other buyers refuse.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Making the process easy for you
          </h2>
          <p className="mt-3">
            Our staff values the vehicle, gives you an offer, and handles the paperwork
            to close the deal. We tow it away free of charge. With a dedicated team
            covering the whole metroplex, selling a car to us takes a phone call or a
            minute on this website, not an afternoon.
          </p>
          <p className="mt-3">
            We also work with salvage yards and dismantlers across North Texas, which
            is why our offers hold up. The car goes to whoever values it most, and that
            is reflected in what we can pay you.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            In our customers&apos; words
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
                <Quote className="h-5 w-5 text-emerald-600" />
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
