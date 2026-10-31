import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Returns Policy",
  description:
    "All sales of used parts and vehicles from Junkerz are final. No returns or exchanges; store credit may be offered at our discretion.",
  alternates: { canonical: `${SITE.url}/returns` },
  robots: { index: true, follow: true },
};

const SECTIONS: [string, string[]][] = [
  ["All sales are final", [
    `Every used part and vehicle sold by ${SITE.legal} is sold as-is. All sales are final. We do not accept returns and we do not offer exchanges or refunds.`,
    "Please check the part number, fitment and condition notes before you buy. If you are not sure a part fits your vehicle, call us first and we will check it with you.",
  ]],
  ["Store credit", [
    `If something is wrong with your purchase, contact us within 30 days of delivery or pickup. We may, at our discretion, offer store credit toward another ${SITE.legal} purchase. Store credit is not cash and cannot be refunded.`,
    "To ask for store credit, tell us your order details and what is wrong, and send photos if you can. The item may need to come back to our yard in the condition we sent it.",
  ]],
  ["Delivery", [
    `We deliver within ${SITE.areaLabel} for a flat fee, shown before you pay. Inspect the item when it arrives and tell us straight away if it was damaged in delivery.`,
  ]],
];

export default function ReturnsPolicy() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Returns policy"
      lede={`How returns work for used parts and vehicles bought from ${SITE.legal}.`}
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
