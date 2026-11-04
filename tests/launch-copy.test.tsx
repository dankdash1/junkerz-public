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
  for (const route of ['home', 'spanish', 'junk', 'contact'] as const) {
    it(`${route} renders ${live ? 'existing active pickup copy' : 'paused pickup copy without immediate pickup promises'}`, async () => {
      vi.resetModules();
      vi.doMock('@/lib/site', async importOriginal => ({...await importOriginal<object>(), PICKUPS_LIVE: live}));
      // No network: homepage uses its normal fallback; catalog is unavailable.
      vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', {status: 503})));
      const page = route === 'home' ? await import('@/app/page')
        : route === 'spanish' ? await import('@/app/carro-viejos/page')
        : route === 'junk' ? await import('@/app/junk-cars/page')
        : await import('@/app/contact-us/page');
      const html = renderToStaticMarkup(await resolveServer(await page.default()));
      const document = new DOMParser().parseFromString(html, 'text/html');
      const text = document.body.textContent || '';
      const metadata = JSON.stringify(page.metadata);
      if (route === 'home') {
        expect(text.includes('Most pickups in 24 to 48 hours')).toBe(live);
        expect(text.includes('Pick a time that suits you.')).toBe(live);
        if (!live) expect(text).toContain('We are not scheduling pickups yet');
      } else if (route === 'spanish') {
        expect(text.includes('Casi siempre en 24 a 48 horas')).toBe(live);
        expect(text.includes('Escoja la hora.')).toBe(live);
        if (!live) expect(text).toContain('Todavía no programamos recogidas');
      } else if (route === 'junk') {
        expect(text.includes('Turn that wreck into cash today')).toBe(live);
        expect(text.includes('usually the same day')).toBe(live);
        expect(metadata.includes('free same-day towing')).toBe(live);
        if (!live) expect(text).toContain('We are not picking up cars yet');
      } else {
        expect(text.includes('Sell your car with Junkerz today')).toBe(live);
        expect(text.includes('Pickups are scheduled during these hours.')).toBe(live);
        expect(metadata.includes('Cash Today')).toBe(live);
        if (!live) expect(text).toContain('We are not scheduling pickups yet');
      }
      // FAQ structured data must not continue advertising the removed timing.
      if (!live) {
        for (const script of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
          const data = JSON.parse(script.textContent || '{}');
          expect(JSON.stringify(data)).not.toMatch(/Usually within 24 to 48 hours|Normalmente entre 24 y 48 horas/);
        }
      }
      expect(document.querySelector('a[href="/quote"], a[href="/quote?lang=es"], form')).not.toBeNull();
    });
  }
}
