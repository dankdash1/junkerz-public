import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Find furniture and request a Junkerz offer with an AI assistant",
  description: "Use a compatible connected assistant to search current Dwell Furniture inventory or request a Junkerz vehicle offer using the real quote system.",
  alternates: { canonical: "https://junkerz.com/assistants" },
};

export default function AssistantsPage() {
  return <PageShell eyebrow="Connected assistants" title="Ask about a car offer or a piece of furniture."
    lede="A compatible connected assistant can check current furniture listings and request an offer from Junkerz using the same business systems as our websites.">
    <div className="space-y-10 text-zinc-700">
      <section className="space-y-3"><h2 className="text-2xl font-bold text-zinc-900">Sell a vehicle with Junkerz</h2>
        <p>Try: “I want to sell my non-running Ford F-150 in Dallas.” Your assistant will ask for the year, make, model, condition, title status, ZIP code and your contact details. After you confirm submission, Junkerz generates the quote.</p>
        <p>An offer marked ready can be accepted under Junkerz’s terms. A quote marked reviewing still needs approval. The assistant must show that distinction and use the amount returned by Junkerz. Use your private offer link to review the details, accept and arrange pickup.</p>
        <p>Junkerz serves Dallas–Fort Worth and surrounding North Texas. Pickup eligibility and scheduling are confirmed through Junkerz.</p>
        <Link className="font-semibold text-brand-700 underline" href="/quote">Get an offer directly on our website</Link>
      </section>
      <section className="space-y-3"><h2 className="text-2xl font-bold text-zinc-900">Find furniture at Dwell</h2>
        <p>Try: “Find a used sectional under $1,500 at Dwell Furniture.” The connection checks currently published inventory and returns prices, photos and product links. Availability can change before checkout.</p>
        <p>Ask about dimensions when they are listed in the product description. Missing dimensions are unknown. Confirm delivery coverage and charges on the furniture website before ordering.</p>
        <a className="font-semibold text-brand-700 underline" href="https://furniture.dankdash.ai">Browse Dwell Furniture</a>
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
