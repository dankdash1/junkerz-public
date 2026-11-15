import type { Metadata } from "next";
import { Check } from "lucide-react";
import PageShell, { BottomCTA } from "@/components/PageShell";
import { SITE, PICKUPS_LIVE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Non-Running Vehicle Removal in DFW",
  description: PICKUPS_LIVE
    ? "Car will not start? Connect with buyers across Dallas–Fort Worth through Junkerz. Get a quote and confirm pickup with your assigned partner. Call 817-420-9180."
    : "Get an offer for your non-running car in Dallas–Fort Worth. Junkerz is opening soon; pickups have not started. Call 817-420-9180.",
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
              PICKUPS_LIVE ? "Confirm a pickup window with your assigned pickup partner" : "Save your offer; we are not scheduling pickups yet",
              PICKUPS_LIVE ? "Your assigned pickup partner collects the vehicle and handles payment at pickup, with free towing" : "We will contact you when pickups start, before arranging collection and payment",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-brand-600" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5">
            Tell your assigned pickup partner if the car cannot roll or steer,
            has flat tyres, or is on grass or blocks. They need those details to
            confirm access and arrange suitable loading equipment.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            On an apartment or city deadline?
          </h2>
          <p className="mt-3">
            Tell us when you say. Apartment complexes and code enforcement across
            DFW give short windows before they tow at your expense. We schedule around
            those dates with the assigned pickup partner. Availability and pickup times must be confirmed before you rely on them.
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
