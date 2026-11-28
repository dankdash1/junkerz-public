import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import { MCP_CONNECTOR_ENABLED } from "@/lib/mcp-connector";

export const metadata: Metadata = {
  title: "Request a vehicle offer with a connected assistant",
  description: "Learn how a compatible connected assistant can request a Junkerz vehicle offer, protect your information and help you review pickup arrangements with an independent buyer.",
  alternates: { canonical: "https://junkerz.com/assistants" },
};

export default function AssistantsPage() {
  if (!MCP_CONNECTOR_ENABLED) notFound();
  return <PageShell eyebrow="Connected assistants" title="Get help selling your vehicle."
    lede="A compatible connected assistant can request a vehicle offer through Junkerz. Junkerz connects you with an independent buyer and pickup partner; the assigned buyer purchases your vehicle and pays at pickup.">
    <div className="space-y-10 text-zinc-700">
      <section className="space-y-3"><h2 className="text-2xl font-bold text-zinc-900">Sell a vehicle with Junkerz</h2>
        <p>Try: “I want to sell my non-running Ford F-150 in Dallas.” Your assistant will ask for the year, make, model, condition, title status, ZIP code and your contact details. After you confirm submission, Junkerz generates the quote.</p>
        <p>A ready offer without a human-approval requirement is guaranteed when the vehicle, condition, major parts and ownership details match your description. Any difference must be explained before you agree to a revised offer. A quote marked reviewing still needs approval. The assistant must show that distinction and use the amount returned by Junkerz.</p>
        <p>You must own the vehicle or have legal authority to sell it. A missing title needs a review of acceptable documents before pickup. A vehicle being on your property does not by itself authorize its sale.</p>
        <p>Use your private offer link to review the details, accept and arrange pickup. Confirm payment details, address access and the pickup window with your assigned buyer or pickup partner. Junkerz coordinates the request and helps with questions through our <Link href="/contact-us" className="underline">support channels</Link>.</p>
        <p>Junkerz covers Dallas–Fort Worth and surrounding North Texas, with each pickup subject to address and partner confirmation. Check our <Link href="/service-areas" className="underline">service-area guide</Link>.</p>
        <Link className="font-semibold text-brand-700 underline" href="/quote">Get an offer directly on our website</Link>
      </section>
      <section className="space-y-3"><h2 className="text-2xl font-bold text-zinc-900">Connect your assistant</h2>
        <p>In an assistant or developer tool that supports custom remote MCP connections, use the server address below. This public connection needs no Junkerz administrator account. Your assistant’s plan and connector settings determine whether it can connect and use actions.</p>
        <p className="break-all rounded-xl bg-zinc-100 p-4 font-mono text-sm">https://junkerz.com/api/mcp</p>
        <p>Searching the web is different from connecting these tools. Siri, Gemini, ChatGPT, Claude and Copilot do not automatically use this connection just because it exists. If your assistant cannot connect, the website links above work directly.</p>
        <a className="font-semibold text-brand-700 underline" href="/assistants/openapi.json">API description for developers</a>
      </section>
      <section className="space-y-3"><h2 className="text-2xl font-bold text-zinc-900">Your information</h2>
        <p>Submitting a quote shares the confirmed vehicle and contact details with Junkerz and may send you an offer email. Your assistant provider also processes the conversation under its own policies. Keep your private offer link to yourself.</p>
        <p><Link href="/privacy-policy" className="underline">Privacy policy</Link> · <Link href="/terms" className="underline">Terms</Link></p>
      </section>
    </div>
  </PageShell>;
}
