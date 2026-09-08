import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Junkerz collects, uses and protects the personal information you give us when you request a quote or sell a vehicle.",
  alternates: { canonical: `${SITE.url}/privacy-policy` },
  robots: { index: true, follow: true },
};

const SECTIONS: [string, string[]][] = [
  ["Collection of your personal information", [
    "When you request a quote we ask for details about your vehicle and for a way to reach you, normally a phone number and an email address. If you accept an offer we also collect the pickup address and the information needed to transfer ownership of the vehicle under Texas law.",
    "We collect this because we cannot price a vehicle, arrange a tow or complete a legal sale without it. We do not ask for information we do not need for those purposes.",
  ]],
  ["Use of your personal information", [
    "We use what you give us to produce your offer, to contact you about that offer, to schedule and complete the pickup, and to keep the records a vehicle purchase requires us to keep.",
    "We may also use your contact details to follow up on a quote you did not complete. You can tell us to stop at any time and we will.",
  ]],
  ["Sharing information with third parties", [
    "To complete a sale we pass the vehicle details and the pickup address to the towing operator collecting it, and where relevant to the salvage yard or dismantler buying the vehicle. They receive only what they need to do that job.",
    "We do not sell your personal information to advertisers or lead brokers.",
    "We may disclose information where the law requires it, for example to law enforcement, to a state motor vehicle authority, or where we must prove the lawful transfer of a vehicle.",
  ]],
  ["Tracking user behaviour", [
    "This website uses analytics to understand which pages people visit and where visitors come from. That information is aggregated and is not used to identify you personally.",
  ]],
  ["Automatically collected information", [
    "Like most websites, our servers record standard technical details such as browser type, device type, approximate location derived from an internet address, and the pages requested. We use this to keep the site working and secure.",
  ]],
  ["Security of your personal information", [
    "We protect your information with access controls and encrypted connections. No system is perfectly secure, but we limit who can see your details and how long we keep them.",
  ]],
  ["Your choices", [
    `You can ask us what we hold about you, ask us to correct it, or ask us to delete it where we are not required to keep it. Contact us at ${SITE.email} or ${SITE.phone}.`,
  ]],
  ["Children", [
    "This site is not intended for children and we do not knowingly collect information from anyone under 18.",
  ]],
  ["Changes to this policy", [
    "We may update this policy as our business changes. The version on this page is always the current one.",
  ]],
];

export default function PrivacyPolicy() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy policy"
      lede={`How ${SITE.legal} collects, uses and protects the information you give us.`}
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
