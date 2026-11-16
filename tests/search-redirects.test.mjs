import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.mjs';

test('www is permanently redirected to the canonical host with the complete path', async () => {
  const redirects = await config.redirects();
  assert.deepEqual(redirects[0], {
    source: '/:path*', has: [{type: 'host', value: 'www.junkerz.com'}],
    destination: 'https://junkerz.com/:path*', permanent: true,
  });
  // Next passes incoming query values through when no destination query replaces them.
  assert.ok(!redirects[0].destination.includes('?'));
  assert.ok(redirects.some(entry => entry.source === '/get-a-quote' && entry.destination === '/quote'));
});

test('canonical-host changes preserve private capability security headers', async () => {
  const rules = await config.headers();
  for (const path of ['/pickup', '/yard-request', '/yard-reply']) {
    const headers = rules.find(rule => rule.source === path)?.headers;
    assert.ok(headers);
    assert.ok(headers.some(header => header.key === 'X-Robots-Tag' && header.value.includes('noindex')));
    assert.ok(headers.some(header => header.key === 'Cache-Control' && header.value === 'no-store'));
    assert.ok(headers.some(header => header.key === 'Referrer-Policy' && header.value === 'no-referrer'));
  }
});

test('private seller and account routes also instruct crawlers not to index', async () => {
  const rules = await config.headers();
  for (const source of ['/schedule/:path*', '/sign/:path*', '/vin/:path*', '/decline/:path*',
    '/status/:path*', '/pickup/:offer_id', '/quote/result', '/buyers/:path*', '/account/:path*', '/payments/:path*']) {
    const headers = rules.find(rule => rule.source === source)?.headers;
    assert.ok(headers?.some(header => header.key === 'X-Robots-Tag' && header.value.includes('noindex')), source);
    assert.ok(headers?.some(header => header.key === 'Referrer-Policy' && header.value === 'no-referrer'), source);
  }
});
