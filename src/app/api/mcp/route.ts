import { createBusinessAssistant } from "@/lib/business-assistant";
import { MCP_CONNECTOR_ENABLED } from "@/lib/mcp-connector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Built only when the connector is on, so the off state never touches the backend.
let assistant: ReturnType<typeof createBusinessAssistant> | undefined;

function handle(request: Request) {
  if (!MCP_CONNECTOR_ENABLED) {
    return new Response("Not Found", { status: 404, headers: { "cache-control": "no-store" } });
  }
  assistant ??= createBusinessAssistant();
  return assistant.fetch(request);
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
