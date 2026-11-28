import { existsSync, readFileSync } from 'node:fs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// DM-OWNER-127 / WP0-397: the AI assistant connector is off. Every door answers
// 404 and nothing reaches the backend. The files are kept for later.

const assistantFetch = vi.fn(async () => new Response('connector answered', { status: 200 }));
const createBusinessAssistant = vi.fn(() => ({ fetch: assistantFetch }));
vi.mock('@/lib/business-assistant', async (orig) => ({ ...(await orig<object>()), createBusinessAssistant }));

let netFetch: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.resetModules();
  assistantFetch.mockClear();
  createBusinessAssistant.mockClear();
  netFetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => { throw new Error('no backend call allowed'); });
});
afterEach(() => { netFetch.mockRestore(); vi.doUnmock('@/lib/mcp-connector'); });

const req = (method: string) => new Request('https://junkerz.com/api/mcp', {
  method,
  headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
  body: method === 'POST' ? JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) : undefined,
});

it('the switch is a hard-coded false in code', async () => {
  const { MCP_CONNECTOR_ENABLED } = await import('@/lib/mcp-connector');
  expect(MCP_CONNECTOR_ENABLED).toBe(false);
  expect(readFileSync('src/lib/mcp-connector.ts', 'utf8')).toMatch(/export const MCP_CONNECTOR_ENABLED = false;/);
  expect(readFileSync('src/lib/mcp-connector.ts', 'utf8')).not.toMatch(/process\.env/);
});

it.each(['GET', 'POST', 'DELETE'])('/api/mcp %s answers 404 with no backend call', async (method) => {
  const route = await import('@/app/api/mcp/route');
  const res = await (route as Record<string, (r: Request) => Promise<Response> | Response>)[method](req(method));
  expect(res.status).toBe(404);
  expect(createBusinessAssistant).not.toHaveBeenCalled();
  expect(assistantFetch).not.toHaveBeenCalled();
  expect(netFetch).not.toHaveBeenCalled();
});

it('near miss: with the switch on, the same request reaches the connector', async () => {
  vi.doMock('@/lib/mcp-connector', () => ({ MCP_CONNECTOR_ENABLED: true }));
  const route = await import('@/app/api/mcp/route');
  const res = await route.POST(req('POST'));
  expect(res.status).toBe(200);
  expect(assistantFetch).toHaveBeenCalledTimes(1);
});

it('/assistants/openapi.json answers 404 and the file is kept', async () => {
  expect(existsSync('src/app/assistants/openapi.json/route.ts')).toBe(true);
  const { GET } = await import('@/app/assistants/openapi.json/route');
  expect(GET().status).toBe(404);
});

it('/assistants calls notFound() and the file is kept', async () => {
  expect(existsSync('src/app/(site)/assistants/page.tsx')).toBe(true);
  const { default: AssistantsPage } = await import('@/app/(site)/assistants/page');
  let digest = '';
  try { AssistantsPage(); } catch (e) { digest = String((e as { digest?: string }).digest ?? e); }
  expect(digest).toMatch(/NOT_FOUND|404/);
});

it('no public listing points at the connector', async () => {
  const { default: sitemap } = await import('@/app/sitemap');
  const llms = readFileSync('public/llms.txt', 'utf8');
  const footer = readFileSync('src/components/SiteFooter.tsx', 'utf8');
  for (const text of [llms, footer, sitemap().map(e => e.url).join(' ')]) {
    expect(text).not.toMatch(/\/assistants|\/api\/mcp|openapi\.json|junkerz_create_quote/i);
  }
  expect(llms).toContain('human-approval requirement');
  expect(llms).toContain('may still accept and request scheduling');
});
