import { z } from "zod";
import { quoteSchema } from "@/lib/business-assistant";

export function GET() {
  const body = z.toJSONSchema(quoteSchema.omit({ request_id: true, customer_confirmed: true }));
  return Response.json({
    openapi: "3.1.0",
    info: { title: "Junkerz and Dwell public business API", version: "1.0.0",
      description: "Read live Dwell inventory and request a customer-confirmed Junkerz offer. Confirm customer consent before submitting contact details. A quote may send an email. Only status=ready is firm; reviewing is pending approval. Check quote capabilities before the first write. No administrator access required." },
    servers: [{ url: "https://api.dankdash.ai/api/public" }],
    paths: {
      "/storefront/products": { get: { operationId: "dwell_list_products", summary: "Read current published furniture and prices",
        parameters: [{ name: "slug", in: "query", required: true, schema: { type: "string", enum: ["furniture"] } }],
        responses: { "200": { description: "Published furniture with price in USD dollars, stock and image URLs. Product links are https://furniture.dankdash.ai/product/{id}." } } } },
      "/junkerz/quote/capabilities": { get: { operationId: "junkerz_quote_capabilities", summary: "Require idempotency=v1 before submitting an assistant quote",
        responses: { "200": { description: "Durable quote retry protection is available" }, "503": { description: "Use the seller website; do not submit an assistant quote yet" } } } },
      "/junkerz/quote": { post: { operationId: "junkerz_create_quote", summary: "Create an offer through the Junkerz quote system", "x-openai-isConsequential": true,
        description: "Customer must confirm details and submission/contact consent first. Use one UUID for the request and identical retries. Never generate a fresh key after a timeout or pending response. Existing quote approval rules apply. Customer accepts and schedules at https://junkerz.com/schedule/{token}; token is private.",
        parameters: [{ name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: body } } },
        responses: { "200": { description: "offer_id, status, offer_cents in USD cents and private token. Only ready is firm. Reviewing is pending approval." },
          "400": { description: "Invalid input; correct details before submitting" }, "409": { description: "Key conflict or request still pending; never retry with a new key" },
          "410": { description: "Replay window expired; contact Junkerz" }, "429": { description: "Rate limited" }, "503": { description: "Quote capability unavailable" } } } },
    },
  }, { headers: { "Cache-Control": "public, max-age=300" } });
}
