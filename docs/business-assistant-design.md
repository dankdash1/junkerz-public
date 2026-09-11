# Junkerz and Dwell assistant connection

## Scope and decisions

The owner requested voice/AI discovery for Junkerz and Dwell Furniture and selected firm offers through the existing Junkerz quote system. Publish live catalog tools and a quote tool using the same public APIs as the websites. A ready offer is firm; a reviewing offer remains pending. Preserve all approval and customer acceptance rules. No model-generated prices.

The shared remote MCP endpoint is `https://junkerz.com/api/mcp`. It uses the official TypeScript SDK, supports legacy and current Streamable HTTP, and has no admin access. Tool names are `dwell_search_products`, `dwell_get_product`, `junkerz_get_quote_requirements`, and `junkerz_create_quote`. Only the last tool writes. Explicit customer confirmation, real contact details, and a durable request UUID are required. Request bodies and private quote links must never be cached or logged by this layer.

The quote adapter probes backend `/quote/capabilities` for durable idempotency v1 before submitting. It never automatically retries an uncertain mutation. Retries must reuse the UUID. The backend preserves the original ready/reviewing status, uses its original amount, and returns the existing private accept/schedule link. Completion of booking happens in the existing authenticated/token-gated seller flow; this release does not let an assistant invent pickup slots or bypass acceptance.

Furniture queries are pinned to slug `furniture`, read published live catalog data each time, and return integer-cent prices and canonical product URLs. Unavailable inventory returns an error; absent dimensions are explicitly unknown. No private database or other tenant endpoints are exposed. A bounded, strict input schema prevents callers from selecting another tenant or upstream URL.

## Independent delivery units

1. Furniture: repair host-specific sitemap and robots routing using real published inventory. Preserve all existing homepage/product/policy rendering and other hosts.
2. Backend: durable optional idempotency on the existing Junkerz quote route, including crash/uncertainty handling and a capability probe. Migration through the normal ship queue.
3. Seller site: shared SDK connector, strict tools, public integration guide and OpenAPI tool description, consistent crawler exclusions, protocol and business behavior tests.

## Validation

- Observe failing tests before implementation; verify actual protocol initialization/list/call behavior.
- Exercise live inventory filtering, absent products, upstream failures, wrong tenant input, invalid contacts, unconfirmed writes, pending approvals, and uncertain quote responses offline.
- Verify duplicate/conflicting/concurrent keyed quotes without production writes.
- Run seller production build and relevant furniture regression tests.
- Independently review code, commit/push PRs, and use existing deployment paths. Never call a queued backend live.
- After publication, verify public discovery resources and read-only MCP tools. Never submit a synthetic quote or send customer messages as a production smoke test.

## Platform boundaries and measurement

A public MCP endpoint requires connection through an assistant that supports remote tools. It is not automatically registered with Siri, Gemini, ChatGPT, Claude, or Copilot merely by being deployed. Search discovery and business profile verification remain separate. Track platform account connections as pending until verified.

Prompt audits measure recommendation/citation visibility under specified dates, locations, wording, and search settings. They do not measure population adoption or customer query volume. Baseline visibility checks can precede publishing without blocking reversible implementation work.
