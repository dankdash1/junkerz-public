import test from 'node:test';
import assert from 'node:assert/strict';
import { createBusinessAssistant } from '../src/lib/business-assistant.ts';

const URL = 'https://junkerz.com/api/mcp';
const rpc = async (app, method, params = {}, options = {}) => {
  const response = await app.fetch(new Request(URL, {
    method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...options.headers },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  }));
  const raw = await response.text();
  const payload = response.headers.get('content-type')?.includes('text/event-stream')
    ? raw.split('\n').find(line => line.startsWith('data: '))?.slice(6) : raw;
  return { response, body: JSON.parse(payload) };
};
const call = (app, name, args) => rpc(app, 'tools/call', { name, arguments: args });
const quote = { request_id: '3bdab741-8dd1-4b0c-a9ce-e035a489a343', customer_confirmed: true,
  year: 2015, make: 'Ford', model: 'F-150', condition: 'dead', title_status: 'clean',
  zip_code: '75201', contact_email: 'seller@example.test', contact_phone: '8175550100' };
const catalog = [{ id: 1, name: 'Blue sectional', price: 1200, stock: 1, condition: 'used', description: 'Pre-owned sofa', image_url: 'https://example.test/sofa.jpg' },
  { id: 2, name: 'Chair', price: 250, stock: 1, condition: 'used' }];
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });

test('official MCP handshake and tool list distinguish writes from reads', async () => {
  const app = createBusinessAssistant({ fetchImpl: async () => { throw Error('unexpected network'); } });
  const init = await rpc(app, 'initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  assert.equal(init.response.status, 200);
  assert.equal(init.body.result.serverInfo.name, 'dankdash-business');
  const { body } = await rpc(app, 'tools/list');
  const write = body.result.tools.find(t => t.name === 'junkerz_create_quote');
  assert.equal(write.annotations.readOnlyHint, false);
  assert.equal(write.annotations.idempotentHint, true);
  assert.ok(write.inputSchema.required.includes('customer_confirmed'));
  assert.ok(body.result.tools.find(t => t.name === 'dwell_search_products').annotations.readOnlyHint);
  await app.close();
});

test('search filters live tenant-pinned catalog by words and integer cents', async () => {
  const seen = [];
  const app = createBusinessAssistant({ fetchImpl: async (url, opts) => { seen.push([url, opts]); return json({ success: true, products: catalog }); } });
  const { body } = await call(app, 'dwell_search_products', { query: 'sectional', max_price_cents: 150000 });
  assert.equal(body.result.structuredContent.products.length, 1);
  assert.equal(body.result.structuredContent.products[0].price_cents, 120000);
  assert.equal(body.result.structuredContent.products[0].product_url, 'https://furniture.dankdash.ai/product/1');
  assert.equal(body.result.structuredContent.products[0].dimensions, null);
  assert.match(seen[0][0], /slug=furniture$/);
  assert.equal(seen[0][1].cache, 'no-store');
  await app.close();
});

test('unavailable inventory returns an actionable error, never a fake catalog', async () => {
  const app = createBusinessAssistant({ fetchImpl: async () => json({ error: 'private database detail' }, 500) });
  const { body } = await call(app, 'dwell_search_products', {});
  assert.equal(body.result.isError, true);
  assert.doesNotMatch(JSON.stringify(body), /private database/);
  await app.close();
});

test('unknown product and invalid tenant input do not expose other inventory', async () => {
  const app = createBusinessAssistant({ fetchImpl: async () => json({ success: true, products: catalog }) });
  const missing = await call(app, 'dwell_get_product', { product_id: 99 });
  assert.equal(missing.body.result.isError, true);
  const injected = await call(app, 'dwell_search_products', { slug: 'cannaflame' });
  assert.equal(injected.body.result.isError, true);
  await app.close();
});

test('a quote requires actual customer confirmation and valid contact fields before network', async () => {
  let requests = 0;
  const app = createBusinessAssistant({ fetchImpl: async () => { requests++; throw Error('unexpected'); } });
  for (const args of [{ ...quote, customer_confirmed: false }, { ...quote, contact_email: '' }, { ...quote, year: 0 }, { ...quote, organization_id: 2 }]) {
    const { body } = await call(app, 'junkerz_create_quote', args);
    assert.equal(body.result.isError, true);
  }
  assert.equal(requests, 0);
  await app.close();
});

test('quote is not submitted before backend retry protection is available', async () => {
  const seen = [];
  const app = createBusinessAssistant({ fetchImpl: async url => { seen.push(url); return json({}, 404); } });
  const { body } = await call(app, 'junkerz_create_quote', quote);
  assert.equal(body.result.isError, true);
  assert.equal(seen.length, 1);
  assert.match(seen[0], /quote\/capabilities$/);
  await app.close();
});

test('ready offers use backend amount, preserve retry key, and provide private acceptance link', async () => {
  const seen = [];
  const app = createBusinessAssistant({ fetchImpl: async (url, opts) => {
    seen.push([url, opts]);
    return url.endsWith('/capabilities') ? json({ idempotency: 'v1', enabled: true }) : json({ offer_id: 37, status: 'ready', offer_cents: 48300, token: 'private-token' });
  } });
  const { body, response } = await call(app, 'junkerz_create_quote', quote);
  assert.equal(body.result.structuredContent.firm_offer, true);
  assert.equal(body.result.structuredContent.offer_cents, 48300);
  assert.equal(body.result.structuredContent.accept_and_schedule_url, 'https://junkerz.com/schedule/private-token');
  assert.equal(seen[1][1].headers['Idempotency-Key'], quote.request_id);
  assert.equal(JSON.parse(seen[1][1].body).year, 2015);
  assert.equal(JSON.parse(seen[1][1].body).customer_confirmed, undefined);
  assert.equal(JSON.parse(seen[1][1].body).attribution.source, 'ai_assistant');
  assert.match(response.headers.get('cache-control'), /no-store/);
  await app.close();
});

test('reviewing is never described as firm even when backend includes an amount', async () => {
  const app = createBusinessAssistant({ fetchImpl: async url => url.endsWith('/capabilities') ? json({ idempotency: 'v1', enabled: true }) : json({ offer_id: 38, status: 'reviewing', offer_cents: 48300, requires_human_approval: true }) });
  const { body } = await call(app, 'junkerz_create_quote', quote);
  assert.equal(body.result.structuredContent.firm_offer, false);
  assert.match(body.result.structuredContent.message, /review/i);
  await app.close();
});

test('uncertain quote failures never retry automatically and retain the request id', async () => {
  let writes = 0;
  const app = createBusinessAssistant({ fetchImpl: async url => {
    if (url.endsWith('/capabilities')) return json({ idempotency: 'v1', enabled: true });
    writes++; throw Error('network timeout');
  } });
  const { body } = await call(app, 'junkerz_create_quote', quote);
  assert.equal(writes, 1);
  assert.equal(body.result.isError, true);
  assert.match(JSON.stringify(body), new RegExp(quote.request_id));
  await app.close();
});

test('untrusted origins and oversized bodies are rejected before tools run', async () => {
  const app = createBusinessAssistant({ fetchImpl: async () => { throw Error('unexpected'); } });
  const evil = await rpc(app, 'tools/list', {}, { headers: { origin: 'https://evil.test' } });
  assert.equal(evil.response.status, 403);
  const large = await app.fetch(new Request(URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(33000) }));
  assert.equal(large.status, 413);
  await app.close();
});

test('Vercel client IP is forwarded, while ordinary spoofed forwarding headers are ignored', async () => {
  const previous = process.env.VERCEL;
  process.env.VERCEL = '1';
  const seen = [];
  const app = createBusinessAssistant({ fetchImpl: async (url, opts) => {
    if (url.endsWith('/capabilities')) return json({ idempotency: 'v1' });
    seen.push(opts.headers);
    return json({ offer_id: 37, status: 'ready', offer_cents: 48300 });
  } });
  try {
    await rpc(app, 'tools/call', { name: 'junkerz_create_quote', arguments: quote }, { headers: { 'x-vercel-forwarded-for': '203.0.113.8', 'x-forwarded-for': '192.0.2.1' } });
    assert.equal(seen[0]['X-Forwarded-For'], '203.0.113.8');
    delete process.env.VERCEL;
    await rpc(app, 'tools/call', { name: 'junkerz_create_quote', arguments: quote }, { headers: { 'x-vercel-forwarded-for': '203.0.113.8' } });
    assert.equal(seen[1]['X-Forwarded-For'], undefined);
  } finally { if (previous === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous; await app.close(); }
});

test('permanent idempotency conflicts stop retries and pending returns retry guidance', async () => {
  let code = 'idempotency_conflict';
  const app = createBusinessAssistant({ fetchImpl: async url => url.endsWith('/capabilities') ? json({ idempotency: 'v1' }) :
    new Response(JSON.stringify({ error: code }), { status: 409, headers: { 'content-type': 'application/json', 'retry-after': '5' } }) });
  const conflict = await call(app, 'junkerz_create_quote', quote);
  assert.equal(conflict.body.result.structuredContent.retry_allowed, false);
  code = 'idempotency_pending';
  const pending = await call(app, 'junkerz_create_quote', quote);
  assert.equal(pending.body.result.structuredContent.retry_after_seconds, 5);
  assert.equal(pending.body.result.structuredContent.error_code, 'idempotency_pending');
  await app.close();
});
