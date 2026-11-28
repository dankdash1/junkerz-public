import { z } from "zod";
import { quoteSchema } from "@/lib/business-assistant";
import { MCP_CONNECTOR_ENABLED } from "@/lib/mcp-connector";

export const dynamic = "force-dynamic";

export function GET() {
  if (!MCP_CONNECTOR_ENABLED) return new Response("Not Found", { status: 404, headers: { "cache-control": "no-store" } });
  const body = z.toJSONSchema(quoteSchema.omit({ request_id: true, customer_confirmed: true }));
  return Response.json({
    openapi: "3.1.0",
    info: { title: "Junkerz vehicle offer API", version: "1.1.0",
      description: "Request a customer-confirmed vehicle offer through Junkerz, an online marketplace connecting sellers with independent buyers and pickup partners. The assigned buyer purchases and pays at pickup. Confirm customer consent before submitting contact details. A quote may send an email. A ready offer without requires_human_approval is guaranteed when vehicle, condition, major parts and ownership details match the description; reviewing is pending approval. Check quote capabilities before the first write. No administrator access required." },
    servers: [{ url: "https://api.dankdash.ai/api/public" }],
    paths: {
      "/junkerz/quote/capabilities": { get: { operationId: "junkerz_quote_capabilities", summary: "Require idempotency=v1 before submitting an assistant quote",
        responses: { "200": { description: "Durable quote retry protection is available" }, "503": { description: "Use the seller website; do not submit an assistant quote yet" } } } },
      "/junkerz/quote": { post: { operationId: "junkerz_create_quote", summary: "Create an offer through the Junkerz quote system", "x-openai-isConsequential": true,
        description: "Customer must confirm details and submission/contact consent first. Use one UUID for the request and identical retries. Never generate a fresh key after a timeout or pending response. Existing quote approval rules apply. Customer accepts and schedules at https://junkerz.com/schedule/{token}; token is private.",
        parameters: [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: body } } },
        responses: { "200": { description: "offer_id, status, requires_human_approval, offer_cents in USD cents and private token. Only ready without requires_human_approval is guaranteed when vehicle, condition, major parts and ownership details match the description. Reviewing is pending approval." },
          "400": { description: "Invalid input; correct details before submitting" }, "409": { description: "Key conflict or request still pending; never retry with a new key" },
          "410": { description: "Replay window expired; contact Junkerz" }, "429": { description: "Rate limited" }, "503": { description: "Quote capability unavailable" } } } },
    },
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
