import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms you agree to when you request a quote, accept an offer or sell a vehicle through Junkerz.",
  alternates: { canonical: `${SITE.url}/terms` },
  robots: { index: true, follow: true },
};

const SECTIONS: [string, string[]][] = [
  ["Agreeing to these terms", [
    `These terms apply when you use this website, request a quote, accept an offer, or sell a vehicle through ${SITE.legal}. If you do not agree with them, please do not use the site or sell a vehicle through the marketplace.`,
    "We may update these terms as our business changes. The version on this page is always the current one, and it applies from the moment it is posted.",
  ]],
  ["What we do", [
    `${SITE.legal} is an online marketplace connecting sellers of junk, wrecked, damaged and non-running vehicles with independent buyers across ${SITE.areaLabel}. Junkerz generates the online offer and provides support to coordinate the sale.`,
    "The assigned independent buyer purchases your vehicle and is responsible for paying you. The pickup partner collects the vehicle and may deliver payment on the buyer's behalf. Confirm the buyer's identity, the agreed amount and the payment method before collection and before signing the sale documents.",
    "We do not operate a public storefront or walk-in yard. We do not charge you a fee to use this site or to receive a quote.",
  ]],
  ["Quotes and offers", [
    "The price you see after filling in the online form is an offer based entirely on what you tell us: the year, make and model, the condition, the damage, and which major parts are still on the vehicle. We do not inspect the vehicle before making it.",
    "Your offer is guaranteed when the vehicle, condition, major parts and ownership details match your description. If the vehicle or ownership details differ, the assigned buyer may revise the offer or decline the purchase. The buyer must explain the difference and any revised amount before you agree. Examples include a missing catalytic converter, engine, transmission or wheels, undisclosed fire or flood damage, a stripped vehicle, or missing authority to sell it.",
    "You are free to decline a revised offer. If you do, the vehicle stays where it is and neither side owes the other anything.",
    "Confirm your offer and pickup arrangements with the assigned partner. If you request a new quote for a different vehicle or changed vehicle details, review and accept that quote before proceeding.",
  ]],
  ["Your promises to us", [
    "By accepting an offer you confirm that you are at least 18 years old, that you are the legal owner of the vehicle or are authorised by the owner to sell it, and that you have the right to transfer it to the buyer.",
    "You confirm the vehicle is not stolen, is not the subject of an active insurance claim you have not told us about, and is not subject to a lien, loan or lease that has not been released, unless you have told us and we have agreed to proceed anyway.",
    "You confirm the information you gave us about the vehicle is accurate and complete to the best of your knowledge.",
    "If any of this turns out to be untrue and we suffer a loss because of it, you are responsible for that loss.",
  ]],
  ["Title and paperwork", [
    "Texas law governs how a vehicle changes hands. Junkerz and your assigned buyer or pickup partner will confirm what your particular case needs before collection.",
    "Tell us if your title is missing or if you are selling on someone else's behalf. You must have documented ownership or legal authority to transfer the vehicle. Your assigned buyer must confirm acceptable documents before pickup. Registration and photo identification are not a blanket substitute for a title, and a quote is not approval of your paperwork.",
    "A vehicle left on your property is not automatically yours to sell. Texas has a separate authority-to-dispose process for certain abandoned vehicles. Ownership or the required legal authority must be established before any purchase or removal through the marketplace.",
    "You must give the assigned buyer or pickup partner valid photo identification at pickup, and it must match the ownership records for the vehicle.",
    "Keep a copy of the sale paperwork with the buyer's contact details, sale date and VIN. Review TxDMV's seller guidance for your options when handling licence plates and submit a Vehicle Transfer Notification within 30 days. Confirm the title or disposal documents needed for your transaction with the assigned buyer, and contact your insurer about ending coverage after the sale.",
  ]],
  ["Pickup and towing", [
    "Towing is free for a confirmed pickup in our service area, whether the vehicle runs or not. The assigned partner must confirm the exact location, access requirements and pickup availability before collection.",
    "Pickup times are confirmed with the assigned buyer or pickup partner in a window, not to the minute, because traffic and earlier jobs move. Someone aged 18 or over must be present with the paperwork and identification.",
    "The vehicle must be accessible to a tow truck. If it is behind a locked gate, blocked in by other vehicles, buried, or otherwise cannot be reached safely, we may need to reschedule.",
    "The assigned pickup partner takes reasonable care during collection, but towing a non-running or damaged vehicle can mark the ground beneath it. We are not responsible for ordinary marks, fluid stains or wear to a driveway or parking surface caused by a vehicle that was already leaking or immobile.",
  ]],
  ["Personal belongings", [
    "Empty the vehicle before your pickup partner arrives. Check the glove box, the console, under the seats, the boot and the spare wheel well.",
    "Once the buyer takes the vehicle, anything left inside it becomes the buyer's property and is normally destroyed or recycled along with the vehicle. We cannot return items found after collection and we are not responsible for them.",
  ]],
  ["Payment", [
    "The assigned independent buyer is responsible for payment at pickup. The pickup partner may deliver that payment on the buyer's behalf. Payment is made to the seller named on the paperwork, in the agreed amount and by the method confirmed before collection.",
    "We do not pay deposits in advance of collection, and we will never ask you to send us money, gift cards or payment details in order to receive an offer. If anyone claiming to be from Junkerz asks you for money, it is not us.",
  ]],
  ["Contacting you", [
    "When you give us your phone number or email address, we may call or email you about your quote, your offer and your pickup.",
    "We only send text messages to sellers who tick the optional text-message box on our quote form. Those texts are about your quote, your offer and your pickup, and may be automated. We will not share mobile information with third parties for promotional or marketing purposes.",
    "This is service contact about a transaction you started; it is not a condition of selling a vehicle through Junkerz. You can tell us to stop at any time by replying STOP to a text or by telling us directly, and we will.",
    "Message frequency varies. Standard message and data rates from your carrier may apply. Reply HELP to any text for help.",
  ]],
  ["Using this website", [
    "You may use this site to get a quote and to manage your own sale. You may not scrape it, copy its content for a competing service, attempt to break into it, or use it to submit information about vehicles you have no connection to.",
    "The text, images, layout and branding on this site belong to us. Vehicle makes and models are named for identification only and belong to their respective manufacturers.",
    "We try to keep the site accurate and available, but we do not guarantee it will be free of errors or never go offline.",
  ]],
  ["Limits on our responsibility", [
    "We are responsible for doing what we agreed to do: making an honest offer and coordinating collection and payment of the agreed amount with your assigned buyer or pickup partner.",
    "We are not responsible for indirect or consequential losses, such as lost time, lost income or the cost of alternative transport, arising from a delayed or cancelled pickup.",
    "Where we are found responsible for something, our liability is limited to the amount of the offer for the vehicle in question. Nothing in these terms limits any liability that cannot be limited under Texas law.",
  ]],
  ["Disputes and governing law", [
    `These terms are governed by the laws of the State of Texas. Any dispute will be handled in the state or federal courts serving ${SITE.city} County, Texas.`,
    "Contact Junkerz by phone or email with your offer reference and a description of the issue. We provide support for offer, paperwork, payment and pickup questions and help coordinate a resolution with your assigned buyer or pickup partner.",
  ]],
];

export default function TermsOfService() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of service"
      lede={`The terms you agree to when you request a quote from or sell a vehicle through ${SITE.legal}.`}
    >
      <div className="space-y-9 text-[16px] leading-relaxed text-zinc-700">
        {SECTIONS.map(([h, paras]) => (
          <section key={h}>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">{h}</h2>
            {paras.map((p, i) => <p key={i} className="mt-3">{p}</p>)}
          </section>
        ))}
        <section>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">Texas vehicle documents</h2>
          <p className="mt-3">
            Consult <a href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/abandoned-vehicles" className="underline">TxDMV abandoned-vehicle guidance</a>{" "}
            for the authority-to-dispose process. If you lost your title, see{" "}
            <a href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/get-a-copy-of-your-title" className="underline">TxDMV title-copy guidance</a>. For sale records, plates and the Vehicle Transfer Notification, see{" "}
            <a href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle" className="underline">TxDMV seller guidance</a>.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">Contact us</h2>
          <p className="mt-3">
            Contact {SITE.legal} by phone at <a href={SITE.phoneHref} className="underline">{SITE.phone}</a>{" "}
            or email at <a href={`mailto:${SITE.email}`} className="underline">{SITE.email}</a>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
