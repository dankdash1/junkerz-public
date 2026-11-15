import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';

// These pages contain async server layout components. Resolve those as Next does,
// leaving ordinary/client components to React's real server renderer.
async function resolveServer(node: React.ReactNode): Promise<React.ReactNode> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveServer));
  if (!React.isValidElement(node)) return node;
  if (typeof node.type === 'function' && node.type.constructor.name === 'AsyncFunction') {
    return resolveServer(await (node.type as Function)(node.props));
  }
  const props = node.props as {children?: React.ReactNode};
  return React.cloneElement(node, {}, await resolveServer(props.children));
}

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => '/' }));
afterEach(() => { vi.unstubAllGlobals(); vi.doUnmock('@/lib/site'); });

for (const live of [false, true]) {
  for (const route of ['home', 'spanish', 'junk', 'contact', 'not-running'] as const) {
    it(`${route} renders ${live ? 'partner-confirmed pickup copy' : 'paused pickup copy'} without immediate pickup promises`, async () => {
      vi.resetModules();
      vi.doMock('@/lib/site', async importOriginal => ({...await importOriginal<object>(), PICKUPS_LIVE: live}));
      // No network: homepage uses its normal fallback; catalog is unavailable.
      vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', {status: 503})));
      const page = route === 'home' ? await import('@/app/page')
        : route === 'spanish' ? await import('@/app/carro-viejos/page')
        : route === 'junk' ? await import('@/app/junk-cars/page')
        : route === 'contact' ? await import('@/app/contact-us/page')
        : await import('@/app/not-running/page');
      const html = renderToStaticMarkup(await resolveServer(await page.default()));
      const document = new DOMParser().parseFromString(html, 'text/html');
      const text = document.body.textContent || '';
      const metadata = JSON.stringify(page.metadata);
      if (route === 'home') {
        expect(text.includes('Pickup timing confirmed with your partner')).toBe(live);
        expect(text).toContain('We do not have a public storefront.');
        const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!)['@graph'];
        const business = graph.find((entry: Record<string, unknown>) => entry['@id'] === 'https://junkerz.com/#business');
        expect(business).toMatchObject({ '@type': 'Organization' });
        expect(business).not.toHaveProperty('address');
        expect(business).not.toHaveProperty('openingHours');
        expect(text.includes('Confirm a pickup window with your assigned partner.')).toBe(live);
        if (!live) expect(text).toContain('We are not scheduling pickups yet');
      } else if (route === 'spanish') {
        expect(text.includes('Horario confirmado con su socio de recogida')).toBe(live);
        expect(text.includes('Confirme la recogida y el pago')).toBe(live);
        expect(text).toContain('No tenemos local abierto al público.');
        if (!live) expect(text).toContain('Todavía no programamos recogidas');
      } else if (route === 'junk') {
        expect(text).toContain('Get an offer for that wreck today');
        expect(text.includes('confirm pickup availability and timing with your assigned buyer or pickup partner')).toBe(live);
        if (!live) expect(text).toContain('We are not picking up cars yet');
      } else if (route === 'contact') {
        expect(text.includes('Start your car sale with Junkerz')).toBe(live);
        expect(text.includes('Callback and pickup times are confirmed with the assigned buyer or pickup partner.')).toBe(live);
        expect(text).toContain('We do not have a public storefront or walk-in yard.');
        if (!live) expect(text).toContain('We are not scheduling pickups yet');
      } else {
        expect(text.includes('Confirm a pickup window with your assigned pickup partner')).toBe(live);
        expect(text).toContain('confirm access and arrange suitable loading equipment');
        expect(text).not.toContain('Our drivers');
        if (!live) expect(text).toContain('we are not scheduling pickups yet');
      }
      const removedPromises = /same.day|cash today|24 (?:to|a|y) 48 (?:hours|horas)|mismo d[ií]a|nuestro patio/i;
      expect(text).not.toMatch(removedPromises);
      expect(metadata).not.toMatch(removedPromises);
      // Search engines must see the same timing qualification as visitors.
      for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
        const data = JSON.parse(script.textContent || '{}');
        expect(JSON.stringify(data)).not.toMatch(removedPromises);
      }
      expect(document.querySelector('a[href="/quote"], a[href="/quote?lang=es"], form')).not.toBeNull();
    });
  }
}

for (const route of ['terms', 'privacy-policy', 'returns'] as const) {
  it(`${route} offers real contact channels without publishing a storefront address`, async () => {
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', {status: 503})));
    const page = route === 'terms' ? await import('@/app/terms/page')
      : route === 'privacy-policy' ? await import('@/app/privacy-policy/page')
      : await import('@/app/returns/page');
    const html = renderToStaticMarkup(await resolveServer(page.default()));
    const document = new DOMParser().parseFromString(html, 'text/html');
    const text = document.body.textContent || '';
    expect(text).not.toMatch(/Skyfrost|75252|our yard/i);
    expect(document.querySelector('a[href="tel:+18174209180"]')).not.toBeNull();
    expect(document.querySelector('a[href="mailto:junkerzdfw@gmail.com"]')).not.toBeNull();
    if (route === 'terms') {
      expect(text).toContain('online marketplace connecting sellers');
      expect(text).not.toContain('We are a vehicle buyer, not a broker');
      expect(text).toContain('The assigned buyer or pickup partner pays when they collect the vehicle');
      expect(text).toContain('You are free to decline a revised offer');
      expect(text).toContain('neither side owes the other anything');
      expect(text).toContain('our liability is limited to the amount of the offer');
    } else if (route === 'privacy-policy') {
      expect(text).toContain('optional text-message consent box');
      expect(text).toContain('Reply STOP to stop receiving texts');
    } else {
      expect(text).toContain('All sales are final');
      expect(text).toContain('within 30 days');
      expect(text).toContain('If we authorize a return for store credit');
      expect(text).toContain('Do not send or bring an item anywhere before receiving those instructions');
    }
  });
}

it('city pages describe the marketplace service without inventing a local yard or fleet', async () => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', {status: 503})));
  const page = await import('@/app/cash-for-junk-cars/[city]/page');
  const html = renderToStaticMarkup(await resolveServer(await page.default({params: Promise.resolve({city: 'dallas'})})));
  const document = new DOMParser().parseFromString(html, 'text/html');
  const text = document.body.textContent || '';
  expect(text).toContain('There is no public yard to visit');
  expect(text).toContain('Confirm the window with your assigned pickup partner');
  expect(text).not.toMatch(/our drivers|our routes|our yard|Skyfrost/i);
  const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!)['@graph'];
  const service = graph.find((entry: Record<string, unknown>) => entry['@type'] === 'Service');
  expect(service.provider).toMatchObject({'@type': 'Organization'});
  expect(service.provider).not.toHaveProperty('address');
  expect(service.provider).not.toHaveProperty('geo');
  expect(service.provider).not.toHaveProperty('openingHours');
});
