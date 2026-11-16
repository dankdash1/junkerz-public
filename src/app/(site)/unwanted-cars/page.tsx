import type { Metadata } from "next";
import { Check } from "lucide-react";
import PageShell, { BottomCTA } from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cash for Unwanted Cars in Dallas–Fort Worth",
  description:
    "Sell an unwanted or broken-down vehicle through Junkerz, a marketplace connecting DFW sellers with independent buyers and pickup partners. Request an offer online.",
  alternates: { canonical: `${SITE.url}/unwanted-cars` },
};

export default function UnwantedCars() {
  return (
    <PageShell
      eyebrow="Unwanted cars"
      title="Find a buyer for your unwanted vehicle"
      lede="Junkerz is an online marketplace connecting sellers with independent vehicle buyers across Dallas–Fort Worth. We generate your online offer and help coordinate the sale. Your assigned buyer purchases and pays for the car, and your pickup partner collects it."
    >
      <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Get the money you deserve
          </h2>
          <p className="mt-3">
            An unwanted car can still have value in scrap metal, its catalytic
            converter and reusable parts. Tell us its condition and which major
            parts are present so your offer reflects the vehicle you are selling.
          </p>
          <p className="mt-3">
            Your offer is guaranteed when the vehicle, condition, major parts and
            ownership details match your description. Any difference must be explained
            before you agree to a revised offer, and you can decline. Your buyer pays
            at collection; towing is free for confirmed pickups in our service area.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            The kinds of cars people call us about
          </h2>
          <ul className="mt-5 space-y-3">
            {[
              "The second car nobody has driven since the repair quote came in",
              "An inherited or transferred vehicle with documents showing your authority to sell it",
              "A trade-in the dealer valued at almost nothing",
              "A car that failed inspection and is not worth the fix",
              "Something that has been sitting so long the registration lapsed years ago",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5">
            A car left by a tenant, relative or previous owner is not automatically
            yours to sell. Confirm ownership or legal authority first. Texas has a
            separate process for abandoned vehicles; see the{" "}
            <a href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/abandoned-vehicles" className="font-semibold text-brand-700 underline">TxDMV guidance</a>.
            If your title is missing, your assigned buyer must confirm acceptable
            documents before scheduling pickup.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Confirm the details before pickup
          </h2>
          <p className="mt-3">
            Start the quote online and you will have a number before you finish your
            coffee. If you would rather explain the situation to a person, call us on{" "}
            <a href={SITE.phoneHref} className="font-semibold text-brand-700 underline">
              {SITE.phone}
            </a>{" "}
            and we will walk through it with you.
          </p>
        </section>
      </div>

      <div className="mt-14 -mx-5">
        <BottomCTA
          heading="Stop looking at it. Sell it."
          body="Get an offer in about a minute, guaranteed when the vehicle, condition, major parts and ownership details match your description. Confirm pickup availability and payment details with your assigned partner."
        />
      </div>
    </PageShell>
  );
}
