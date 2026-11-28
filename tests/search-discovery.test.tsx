import React from 'react';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import QuotePage, { metadata as quoteMetadata } from '@/app/(site)/quote/page';
import { metadata as homeMetadata } from '@/app/(site)/page';
import { metadata as spanishMetadata } from '@/app/(spanish)/carro-viejos/page';
import AssistantsPage, { metadata as assistantMetadata } from '@/app/(site)/assistants/page';
import { GET as openapi } from '@/app/assistants/openapi.json/route';
import EnglishLayout from '@/app/(site)/layout';
import SpanishLayout from '@/app/(spanish)/layout';
import sitemap from '@/app/sitemap';
import robots from '@/app/robots';

// The saved connector work stays tested with the switch forced on here;
// tests/mcp-connector-off.test.tsx proves the shipped (off) state.
vi.mock('@/lib/mcp-connector', () => ({ MCP_CONNECTOR_ENABLED: true }));
vi.mock('next/font/local', () => ({ default: () => ({ variable: 'font-test' }) }));
vi.mock('@/components/QuoteWizard', () => ({ default: () => { throw new Promise(() => {}); } }));
vi.mock('@/components/PageShell', () => ({
  default: ({ title, lede, children }: {title: string; lede: string; children: React.ReactNode}) => <main><h1>{title}</h1><p>{lede}</p>{children}</main>,
  SiteHeader: () => <header />,
}));
vi.mock('@/components/SiteExtras', () => ({ default: () => null }));
vi.mock('@/components/NotLive', () => ({ NotLiveBanner: () => null }));
vi.mock('@/components/ShopCart', () => ({ ShopCartProvider: ({children}: {children: React.ReactNode}) => <>{children}</> }));
vi.mock('@vercel/analytics/react', () => ({ Analytics: () => null }));

it('serves a useful quote introduction when the interactive form cannot render yet', () => {
  const html = renderToStaticMarkup(<QuotePage />);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  expect(doc.querySelector('h1')?.textContent).toBe('Get a junk-car offer in Dallas–Fort Worth');
  expect(doc.body.textContent).toContain('No VIN or license plate needed');
  expect(doc.body.textContent).toContain('No obligation to accept.');
  expect(doc.querySelector('a[href="tel:+18174209180"]')).not.toBeNull();
  expect(quoteMetadata.title).not.toEqual(homeMetadata.title);
  expect(quoteMetadata.alternates?.canonical).toBe('https://junkerz.com/quote');
});

it('renders Spanish and English document languages on the server with reciprocal language URLs', () => {
  expect(renderToStaticMarkup(<SpanishLayout><p>Hola</p></SpanishLayout>)).toContain('<html lang="es">');
  expect(renderToStaticMarkup(<EnglishLayout><p>Hello</p></EnglishLayout>)).toContain('<html lang="en">');
  expect(homeMetadata.alternates?.languages).toEqual(spanishMetadata.alternates?.languages);
  expect(homeMetadata.alternates?.languages).toMatchObject({ 'en-US': 'https://junkerz.com', 'es-US': 'https://junkerz.com/carro-viejos' });
});

it('keeps public assistant discovery about vehicle offers and qualifies accepted offers', async () => {
  const schema = await openapi().json();
  const html = renderToStaticMarkup(<AssistantsPage />);
  const llms = readFileSync('public/llms.txt', 'utf8');
  expect(`${JSON.stringify(schema)} ${JSON.stringify(assistantMetadata)} ${html} ${llms}`).not.toMatch(/dwell|furniture/i);
  expect(Object.keys(schema.paths).sort()).toEqual(['/junkerz/quote', '/junkerz/quote/capabilities']);
  expect(schema.paths['/junkerz/quote'].post.parameters).toContainEqual(expect.objectContaining({name: 'Idempotency-Key', required: true}));
  expect(schema.paths['/junkerz/quote'].post.description).toContain('consent');
  expect(html).toContain('ownership details match your description');
  expect(llms).toContain('human-approval requirement');
  expect(llms).toContain('may still accept and request scheduling');
});

it('publishes the service directory without inventing content modification dates or indexing private routes', () => {
  const urls = sitemap();
  expect(urls.some(entry => entry.url === 'https://junkerz.com/service-areas')).toBe(true);
  expect(urls.every(entry => !entry.lastModified)).toBe(true);
  expect(urls.every(entry => !/\/(?:pickup|yard-request|yard-reply|schedule|sign|vin|decline|account|buyers)(?:\/|$)/.test(entry.url))).toBe(true);
  const rules = robots().rules;
  const groups = Array.isArray(rules) ? rules : [rules];
  for (const group of groups) {
    expect(group.disallow).toEqual(expect.arrayContaining(['/pickup', '/yard-request', '/yard-reply', '/account', '/quote/result']));
  }
});
