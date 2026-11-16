import type { Metadata } from "next";
import { Check } from "lucide-react";
import PageShell, { BottomCTA } from "@/components/PageShell";
import { SITE, PICKUPS_LIVE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell Wrecked & Junk Cars for Cash in DFW",
  description: PICKUPS_LIVE
    ? "Connect with buyers for wrecked and junk cars across Dallas–Fort Worth. Get an instant quote and confirm pickup with your assigned partner. Call 817-420-9180."
    : "Get an offer for your wrecked or junk car in Dallas–Fort Worth. Junkerz is opening soon; pickups have not started. Call 817-420-9180.",
  alternates: { canonical: `${SITE.url}/junk-cars` },
};

export default function JunkCars() {
  return (
    <PageShell
      eyebrow="Wrecked & junk cars"
      title="Sell your wrecked vehicle, damage and all"
      lede="Junkerz connects wrecked-car sellers with buyers across Dallas–Fort Worth. A junk car in the driveway can still be worth real money. Start an instant quote and arrange pickup through your assigned partner."
    >
      <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Parting ways with your car
          </h2>
          <p className="mt-3">
            {PICKUPS_LIVE
              ? "Junkerz generates your online offer. Your assigned independent buyer purchases the vehicle and pays you at pickup; the pickup partner collects it. Confirm availability, timing and payment details before collection."
              : "Get a fair quote for your wrecked car now. We are not picking up cars yet. Save your offer and we will contact you when pickups start, before arranging collection and payment."}
          </p>
          <p className="mt-3">
            Describe collision damage and any missing parts accurately. The catalytic
            converter, transmission, wheels and scrap weight can contribute to value,
            but an accident may damage those parts too. Tell us about an active
            insurance claim or lien before agreeing to a sale.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Why sell your car through Junkerz
          </h2>
          <p className="mt-3">
            Plenty of outfits buy wrecked cars around DFW. Here is what you get with us.
          </p>
          <ul className="mt-5 space-y-3">
            {[
              "A fair price for your vehicle, quoted before anyone drives out",
              "Payment from your assigned buyer at pickup, with the amount and method confirmed beforehand",
              "Free towing for confirmed pickups in our service area",
              "Ownership and transfer documents checked with your assigned buyer before collection",
              "Help with missing-title questions; a missing title does not automatically qualify for a sale",
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
            What counts as a wrecked car
          </h2>
          <p className="mt-3">
            More than people think. Buyers accept collision write-offs, cars with deployed
            airbags, flood and hail damage, fire damage, vehicles stripped for parts,
            and cars an insurer has already declared a total loss. If it is sitting
            on your property and you own it or have documented authority to sell it,
            start a quote. A vehicle left behind by someone else needs an ownership
            or legal-authority review before removal.
          </p>
        </section>
      </div>

      <div className="mt-14 -mx-5">
        <BottomCTA
          heading="Get an offer for that wreck today"
          body="Get an offer in about a minute, guaranteed when the vehicle, condition, major parts and ownership details match your description. Any difference is explained before you agree to a revised offer."
        />
      </div>
    </PageShell>
  );
}
