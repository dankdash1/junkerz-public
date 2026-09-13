import { createBusinessAssistant } from "@/lib/business-assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const assistant = createBusinessAssistant();

export const POST = (request: Request) => assistant.fetch(request);
export const GET = (request: Request) => assistant.fetch(request);
export const DELETE = (request: Request) => assistant.fetch(request);
