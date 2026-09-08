import type { Metadata } from "next";
import { Check } from "lucide-react";
import PageShell, { BottomCTA } from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell Wrecked & Junk Cars for Cash in DFW",
  description:
    "Junkerz buys wrecked and junk cars across Dallas–Fort Worth. Fair quote, cash on the spot, free same-day towing. Call 817-420-9180.",
  alternates: { canonical: `${SITE.url}/junk-cars` },
};

export default function JunkCars() {
  return (
    <PageShell
      eyebrow="Wrecked & junk cars"
      title="We buy your wrecked vehicle, damage and all"
      lede="Junkerz buys wrecked cars right across Dallas–Fort Worth. A junk car in the driveway is an inconvenience for everyone. Ours is the team that proves it is still worth real money."
    >
      <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Parting ways with your car
          </h2>
          <p className="mt-3">
            When it is time to let the car go, we make it quick. Our team gives you
            a fair quote once we know what you have, and you do not have to guess at
            the number or wait for a callback. Once we agree a price, you get cash in
            hand as we take the vehicle away, usually the same day.
          </p>
          <p className="mt-3">
            Collision damage does not lower the offer as much as most people expect.
            A caved-in front end leaves the catalytic converter, the transmission,
            the wheels and the scrap weight untouched, and those are the parts that
            carry most of the value.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Why sell your car to us
          </h2>
          <p className="mt-3">
            Plenty of outfits buy wrecked cars around DFW. Here is what you get with us.
          </p>
          <ul className="mt-5 space-y-3">
            {[
              "A fair price for your vehicle, quoted before anyone drives out",
              "Cash on the spot, handed over at pickup and never posted later",
              "Towing away at no cost, anywhere in our Dallas–Fort Worth area",
              "Texas paperwork handled by people who do it every day",
              "A straight answer when you have no title, not a runaround",
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
            More than people think. We buy collision write-offs, cars with deployed
            airbags, flood and hail damage, fire damage, vehicles stripped for parts,
            and cars an insurer has already declared a total loss. If it is sitting
            on your property and you want it gone, start a quote and we will price it.
          </p>
        </section>
      </div>

      <div className="mt-14 -mx-5">
        <BottomCTA
          heading="Turn that wreck into cash today"
          body="Tell us what you have and get a guaranteed number in about a minute. Free towing anywhere in DFW."
        />
      </div>
    </PageShell>
  );
}
