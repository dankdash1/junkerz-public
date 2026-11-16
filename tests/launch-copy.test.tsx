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
      const page = route === 'home' ? await import('@/app/(site)/page')
        : route === 'spanish' ? await import('@/app/(spanish)/carro-viejos/page')
        : route === 'junk' ? await import('@/app/(site)/junk-cars/page')
        : route === 'contact' ? await import('@/app/(site)/contact-us/page')
        : await import('@/app/(site)/not-running/page');
      const html = renderToStaticMarkup(await resolveServer(await page.default()));
      const document = new DOMParser().parseFromString(html, 'text/html');
      const text = document.body.textContent || '';
      const metadata = JSON.stringify(page.metadata);
      if (route === 'home') {
        expect(text.includes('Convenient pickup scheduling')).toBe(live);
        expect(document.querySelector('section')?.textContent).not.toMatch(/independent buyer|pickup partner|public storefront/);
        const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!)['@graph'];
        const business = graph.find((entry: Record<string, unknown>) => entry['@id'] === 'https://junkerz.com/#business');
        expect(business).toMatchObject({ '@type': 'Organization' });
        expect(business).not.toHaveProperty('address');
        expect(business).not.toHaveProperty('openingHours');
        expect(text.includes('Arrange a convenient time with our pickup partner')).toBe(live);
        expect(text).toContain('Your guaranteed offer holds when the vehicle, condition, major parts and ownership details match your description.');
        expect(text).toContain('registration and photo ID are not a blanket substitute for a title.');
        expect(document.querySelector('a[href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/abandoned-vehicles"]')).not.toBeNull();
        if (!live) expect(text).toContain('We are not scheduling pickups yet');
      } else if (route === 'spanish') {
        expect(text.includes('Recogida a una hora conveniente')).toBe(live);
        expect(text.includes('Confirme la recogida y el pago')).toBe(live);
        expect(document.querySelector('section')?.textContent).not.toMatch(/comprador independiente|socio de recogida|local abierto/);
        expect(text).toContain('El comprador independiente asignado compra el carro y es responsable de pagarle al recogerlo.');
        expect(document.querySelector('a[href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/abandoned-vehicles"]')).not.toBeNull();
        if (!live) expect(text).toContain('Todavía no programamos recogidas');
      } else if (route === 'junk') {
        expect(text).toContain('Get an offer for that wreck today');
        expect(text.includes('Confirm availability, timing and payment details before collection.')).toBe(live);
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
      const imageAltText = Array.from(document.querySelectorAll('img')).map(image => image.alt).join(' ');
      expect(`${text} ${metadata} ${imageAltText}`).not.toMatch(/Junkerz (?:buys|compra)\b|\bwe buy\b|\bcompramos\b/i);
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
    const page = route === 'terms' ? await import('@/app/(site)/terms/page')
      : route === 'privacy-policy' ? await import('@/app/(site)/privacy-policy/page')
      : await import('@/app/(site)/returns/page');
    const html = renderToStaticMarkup(await resolveServer(page.default()));
    const document = new DOMParser().parseFromString(html, 'text/html');
    const text = document.body.textContent || '';
    expect(text).not.toMatch(/Skyfrost|75252|our yard/i);
    expect(document.querySelector('a[href="tel:+18174209180"]')).not.toBeNull();
    expect(document.querySelector('a[href="mailto:junkerzdfw@gmail.com"]')).not.toBeNull();
    if (route === 'terms') {
      expect(text).toContain('online marketplace connecting sellers');
      expect(text).not.toContain('We are a vehicle buyer, not a broker');
      expect(text).toContain('The assigned independent buyer is responsible for payment at pickup.');
      expect(text).toContain('Your offer is guaranteed when the vehicle, condition, major parts and ownership details match your description.');
      expect(text).toContain('The buyer must explain the difference and any revised amount before you agree.');
      expect(text).toContain('a quote is not approval of your paperwork.');
      expect(text).toContain('submit a Vehicle Transfer Notification within 30 days.');
      expect(text).not.toContain('The buyer will submit the transfer paperwork');
      expect(document.querySelector('a[href="https://www.txdmv.gov/motorists/buying-or-selling-a-vehicle/abandoned-vehicles"]')).not.toBeNull();
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
  const page = await import('@/app/(site)/cash-for-junk-cars/[city]/page');
  const html = renderToStaticMarkup(await resolveServer(await page.default({params: Promise.resolve({city: 'dallas'})})));
  const document = new DOMParser().parseFromString(html, 'text/html');
  const text = document.body.textContent || '';
  expect(text).toContain('there is no public yard to visit');
  expect(text).toContain('Agree on the window, paperwork and payment method before collection');
  expect(text).not.toMatch(/our drivers|our routes|our yard|Skyfrost/i);
  const metadata = await page.generateMetadata({params: Promise.resolve({city: 'dallas'})});
  expect(`${text} ${JSON.stringify(metadata)}`).not.toMatch(/Junkerz buys|\bwe buy\b/i);
  const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]')!.textContent!)['@graph'];
  const service = graph.find((entry: Record<string, unknown>) => entry['@type'] === 'Service');
  expect(service.provider).toMatchObject({'@type': 'Organization'});
  expect(service.provider).not.toHaveProperty('address');
  expect(service.provider).not.toHaveProperty('geo');
  expect(service.provider).not.toHaveProperty('openingHours');
});

// Published CMS copy must not restore the retired disclosure beside the offer form.
it('replaces the retired CMS subtitle without discarding custom homepage content', async () => {
  vi.resetModules();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({content: {
    hero_title: 'A custom homepage title',
    hero_subtitle: 'Connect with junk-car buyers across Dallas–Fort Worth. Tell us about your vehicle, get an instant quote, and confirm pickup arrangements with your assigned partner.',
  }}))));
  const page = await import('@/app/(site)/page');
  const html = renderToStaticMarkup(await resolveServer(await page.default()));
  const doc = new DOMParser().parseFromString(html, 'text/html');
  expect(doc.querySelector('h1')?.textContent).toBe('A custom homepage title');
  expect(doc.querySelector('section')?.textContent).toContain('arrange free pickup, and get paid');
  expect(doc.querySelector('section')?.textContent).not.toContain('assigned partner');
});
