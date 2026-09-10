import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms you agree to when you request a quote, accept an offer or sell a vehicle to Junkerz.",
  alternates: { canonical: `${SITE.url}/terms` },
  robots: { index: true, follow: true },
};

const SECTIONS: [string, string[]][] = [
  ["Agreeing to these terms", [
    `These terms apply when you use this website, request a quote, accept an offer, or sell a vehicle to ${SITE.legal}. If you do not agree with them, please do not use the site or sell us a vehicle.`,
    "We may update these terms as our business changes. The version on this page is always the current one, and it applies from the moment it is posted.",
  ]],
  ["What we do", [
    `${SITE.legal} buys junk, wrecked, damaged and non-running vehicles for cash across ${SITE.areaLabel}. We collect the vehicle ourselves and pay you when we take it away.`,
    "We are a vehicle buyer, not a broker, an auction, a lender or a repair shop. We do not charge you a fee to use this site or to receive a quote.",
  ]],
  ["Quotes and offers", [
    "The price you see after filling in the online form is an offer based entirely on what you tell us: the year, make and model, the condition, the damage, and which major parts are still on the vehicle. We do not inspect the vehicle before making it.",
    "An offer is valid only for the vehicle you described. If the vehicle we find at pickup differs from that description, we may revise the offer or decline the purchase. The most common reasons are a missing catalytic converter, a missing engine or transmission, missing wheels, fire or flood damage that was not mentioned, or a vehicle that has already been stripped.",
    "You are free to decline a revised offer. If you do, we leave the vehicle where it is and neither side owes the other anything.",
    "Offers are not held open indefinitely. Scrap metal and used parts prices move, so an offer may be re-quoted if a significant amount of time passes before pickup.",
  ]],
  ["Your promises to us", [
    "By accepting an offer you confirm that you are at least 18 years old, that you are the legal owner of the vehicle or are authorised by the owner to sell it, and that you have the right to transfer it to us.",
    "You confirm the vehicle is not stolen, is not the subject of an active insurance claim you have not told us about, and is not subject to a lien, loan or lease that has not been released, unless you have told us and we have agreed to proceed anyway.",
    "You confirm the information you gave us about the vehicle is accurate and complete to the best of your knowledge.",
    "If any of this turns out to be untrue and we suffer a loss because of it, you are responsible for that loss.",
  ]],
  ["Title and paperwork", [
    "Texas law governs how a vehicle changes hands. We handle this paperwork daily and will tell you what your particular case needs before we collect the vehicle.",
    "We can buy some vehicles without a title, but not all of them, and the rules depend on the age of the vehicle and how you came to own it. Whether a vehicle can be bought without a title is decided case by case, and we will tell you honestly if we cannot buy yours.",
    "You must give us valid photo identification at pickup, and it must match the ownership records for the vehicle.",
    "You are responsible for removing your licence plates and for cancelling your own registration and insurance after the sale. We will submit the transfer paperwork required of a buyer.",
  ]],
  ["Pickup and towing", [
    "Towing is free everywhere in our service area. There is no charge for collection whether the vehicle runs or not.",
    "Pickup times are scheduled in a window, not to the minute, because traffic and earlier jobs move. Someone aged 18 or over must be present with the paperwork and identification.",
    "The vehicle must be accessible to a tow truck. If it is behind a locked gate, blocked in by other vehicles, buried, or otherwise cannot be reached safely, we may need to reschedule.",
    "We take reasonable care during collection, but towing a non-running or damaged vehicle can mark the ground beneath it. We are not responsible for ordinary marks, fluid stains or wear to a driveway or parking surface caused by a vehicle that was already leaking or immobile.",
  ]],
  ["Personal belongings", [
    "Empty the vehicle before we arrive. Check the glove box, the console, under the seats, the boot and the spare wheel well.",
    "Once we take the vehicle, anything left inside it becomes our property and is normally destroyed or recycled along with the vehicle. We cannot return items found after collection and we are not responsible for them.",
  ]],
  ["Payment", [
    "We pay when we collect the vehicle, not before and not after. Payment is made to the seller named on the paperwork.",
    "We do not pay deposits in advance of collection, and we will never ask you to send us money, gift cards or payment details in order to receive an offer. If anyone claiming to be from Junkerz asks you for money, it is not us.",
  ]],
  ["Contacting you", [
    "When you give us your phone number or email address, you agree that we may contact you about your quote, your offer and your pickup, including by text message and automated messages.",
    "This is service contact about a transaction you started; it is not a condition of selling us a vehicle. You can tell us to stop at any time by replying STOP to a text or by telling us directly, and we will.",
    "Standard message and data rates from your carrier may apply.",
  ]],
  ["Using this website", [
    "You may use this site to get a quote and to manage your own sale. You may not scrape it, copy its content for a competing service, attempt to break into it, or use it to submit information about vehicles you have no connection to.",
    "The text, images, layout and branding on this site belong to us. Vehicle makes and models are named for identification only and belong to their respective manufacturers.",
    "We try to keep the site accurate and available, but we do not guarantee it will be free of errors or never go offline.",
  ]],
  ["Limits on our responsibility", [
    "We are responsible for doing what we agreed to do: making an honest offer, collecting the vehicle, and paying you the agreed amount.",
    "We are not responsible for indirect or consequential losses, such as lost time, lost income or the cost of alternative transport, arising from a delayed or cancelled pickup.",
    "Where we are found responsible for something, our liability is limited to the amount of the offer for the vehicle in question. Nothing in these terms limits any liability that cannot be limited under Texas law.",
  ]],
  ["Disputes and governing law", [
    `These terms are governed by the laws of the State of Texas. Any dispute will be handled in the state or federal courts serving ${SITE.city} County, Texas.`,
    "Before anything formal, please call or email us. Almost everything is a misunderstanding about the vehicle's condition, and almost everything gets sorted out in one conversation.",
  ]],
];

export default function TermsOfService() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of service"
      lede={`The terms you agree to when you request a quote from or sell a vehicle to ${SITE.legal}.`}
    >
      <div className="space-y-9 text-[16px] leading-relaxed text-zinc-700">
        {SECTIONS.map(([h, paras]) => (
          <section key={h}>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">{h}</h2>
            {paras.map((p, i) => <p key={i} className="mt-3">{p}</p>)}
          </section>
        ))}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">Contact us</h2>
          <p className="mt-3">
            {SITE.legal}, {SITE.street}, {SITE.city}, {SITE.state} {SITE.postal}.
            Phone {SITE.phone}. Email {SITE.email}.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
