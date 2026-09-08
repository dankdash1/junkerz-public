import type { Metadata } from "next";
import { Check } from "lucide-react";
import PageShell, { BottomCTA } from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Non-Running Vehicle Removal in DFW",
  description:
    "Car will not start? Junkerz buys non-running vehicles across Dallas–Fort Worth with a fair cash offer and free same-day pickup. Call 817-420-9180.",
  alternates: { canonical: `${SITE.url}/not-running` },
};

export default function NotRunning() {
  return (
    <PageShell
      eyebrow="Cars that will not start"
      title="Getting rid of a car that no longer moves"
      lede="Nobody wants a broken-down car outside the house or blocking a work bay. When it is time for that one to go, Junkerz buys it where it sits, anywhere in Dallas–Fort Worth."
    >
      <div className="space-y-10 text-[17px] leading-relaxed text-zinc-700">
        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            A dead engine does not mean a dead value
          </h2>
          <p className="mt-3">
            This is the part most people get wrong. A car that will not turn over is
            still worth real money. Its weight in scrap steel has a live market price,
            the catalytic converter is valuable on its own, and the wheels, glass,
            body panels and interior all still sell. None of that needs the engine to run.
          </p>
          <p className="mt-3">
            We price non-running cars every day and it is the bulk of what we buy.
            Seized motors, blown transmissions, snapped timing belts, cars that have
            sat under a tarp for six years. All of it.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            How the pickup works
          </h2>
          <p className="mt-3">
            We keep the process short because you have already spent long enough on this car.
          </p>
          <ul className="mt-5 space-y-3">
            {[
              "You tell us the year, make, model and roughly what is wrong with it",
              "We give you a guaranteed cash number, no inspection visit needed first",
              "You pick a pickup window that suits you",
              "Our truck comes to you, we hand over the cash, and we tow it free",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5">
            The car does not need to roll, steer or hold air in the tyres. Our
            drivers bring the equipment to load a vehicle that cannot move under
            its own power. It can sit on the grass, on a flat, or on blocks.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            On an apartment or city deadline?
          </h2>
          <p className="mt-3">
            Tell us when you say. Apartment complexes and code enforcement across
            DFW give short windows before they tow at your expense. We schedule around
            those dates, and pickups near our north Dallas yard can often happen the same day.
          </p>
        </section>
      </div>

      <div className="mt-14 -mx-5">
        <BottomCTA
          heading="Get that dead car off your hands"
          body="A guaranteed cash offer in about a minute, and a free tow whether it starts or not."
        />
      </div>
    </PageShell>
  );
}
