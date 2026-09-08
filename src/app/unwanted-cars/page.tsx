import type { Metadata } from "next";
import { Check } from "lucide-react";
import PageShell, { BottomCTA } from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cash for Unwanted Cars in Dallas–Fort Worth",
  description:
    "Got a car you no longer want? Junkerz pays cash for unwanted and broken-down vehicles across DFW, with an instant quote and no towing fees. Call 817-420-9180.",
  alternates: { canonical: `${SITE.url}/unwanted-cars` },
};

export default function UnwantedCars() {
  return (
    <PageShell
      eyebrow="Unwanted cars"
      title="A buyer you can trust for a broken-down vehicle"
      lede="When a vehicle stops being usable you need a buyer who will actually put it to work again, in parts or in scrap. Junkerz takes the worn-out car off your hands and puts cash in them instead."
    >
      <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Get the money you deserve
          </h2>
          <p className="mt-3">
            An unwanted car is not the same as a worthless one. Ours is a proper
            valuation, not a lowball offer designed to be haggled down at the kerb.
            We quote from live scrap prices, the catalytic converter, and the parts
            that still have a buyer, then we stand behind that number.
          </p>
          <p className="mt-3">
            You get an instant quote and cash at collection with no towing fee taken
            off the top. What we say on the screen is what lands in your hand.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            The kinds of cars people call us about
          </h2>
          <ul className="mt-5 space-y-3">
            {[
              "The second car nobody has driven since the repair quote came in",
              "A vehicle left behind by a tenant, a relative or a previous owner",
              "A trade-in the dealer valued at almost nothing",
              "A car that failed inspection and is not worth the fix",
              "Something that has been sitting so long the registration lapsed years ago",
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
            Reach out and we will schedule it
          </h2>
          <p className="mt-3">
            Start the quote online and you will have a number before you finish your
            coffee. If you would rather explain the situation to a person, call us on{" "}
            <a href={SITE.phoneHref} className="font-semibold text-emerald-700 underline">
              {SITE.phone}
            </a>{" "}
            and we will walk through it with you.
          </p>
        </section>
      </div>

      <div className="mt-14 -mx-5">
        <BottomCTA
          heading="Stop looking at it. Sell it."
          body="One minute for a guaranteed offer, free towing anywhere in Dallas–Fort Worth, cash at pickup."
        />
      </div>
    </PageShell>
  );
}
