import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { CITIES } from '@/lib/site';
import { CITY_GUIDES, LOCAL_SOURCES } from '@/lib/local-guides';
import { SERVICE_AREA_TOWNS, townAnchor, townHref } from '@/lib/service-areas';
import CityPage, { generateMetadata, generateStaticParams } from '@/app/(site)/cash-for-junk-cars/[city]/page';
import ServiceAreasPage from '@/app/(site)/service-areas/page';

// This suite checks static editorial routes; the existing quote-flow tests own
// form behavior. Avoid a catalog request or seller submission during rendering.
vi.mock('@/components/PageShell', () => ({ SiteHeader: () => null, SiteFooter: () => null }));
vi.mock('@/components/HeroQuoteForm', () => ({ default: () => <form aria-label="Get a vehicle offer" /> }));
vi.mock('@/components/StickyMobileBar', () => ({ default: () => null }));

const requestedGaps = ['wilmer', 'seagoville', 'hutchins', 'lancaster', 'balch-springs', 'forney', 'red-oak', 'ferris', 'azle'];

it('publishes every requested gap and preserves the existing Terrell and Midlothian routes', () => {
  const slugs = generateStaticParams().map(({ city }) => city);
  expect(slugs).toHaveLength(49);
  expect(new Set(slugs).size).toBe(slugs.length);
  expect(slugs).toEqual(expect.arrayContaining([...requestedGaps, 'terrell', 'midlothian']));
  expect(Object.keys(CITY_GUIDES).sort()).toEqual([...slugs].sort());
});

it('every guide has distinct preparation and primary geography source URLs', () => {
  const guides = CITIES.map((city) => CITY_GUIDES[city.slug]);
  expect(new Set(guides.map((guide) => guide.advice.join(' '))).size).toBe(guides.length);
  for (const guide of guides) {
    expect(guide.preparation).toBeTruthy();
    expect(guide.sources.length).toBeGreaterThan(0);
    for (const source of guide.sources) expect(LOCAL_SOURCES[source].url).toMatch(/^https:\/\//);
  }
});

it('nearby links lead to an existing guide or a real directory anchor', () => {
  const document = new DOMParser().parseFromString(renderToStaticMarkup(<ServiceAreasPage />), 'text/html');
  const guideRoutes = new Set(CITIES.map(({ slug }) => `/cash-for-junk-cars/${slug}`));
  for (const city of CITIES) {
    expect(SERVICE_AREA_TOWNS).toContain(city.name);
    for (const neighbor of city.near) {
      expect(SERVICE_AREA_TOWNS).toContain(neighbor);
      const href = townHref(neighbor);
      if (href.startsWith('/service-areas#')) expect(document.getElementById(townAnchor(neighbor))).not.toBeNull();
      else expect(guideRoutes.has(href)).toBe(true);
    }
  }
  expect(document.querySelectorAll('a[href^="/cash-for-junk-cars/"]')).toHaveLength(CITIES.length);
  expect(new Set(SERVICE_AREA_TOWNS.map(townAnchor)).size).toBe(SERVICE_AREA_TOWNS.length);
});

it('Dallas and Mesquite render different useful guides with a direct quote and qualified offer', async () => {
  const localSections: string[] = [];
  for (const city of ['dallas', 'mesquite']) {
    const html = renderToStaticMarkup(await CityPage({ params: Promise.resolve({ city }) }));
    const document = new DOMParser().parseFromString(html, 'text/html');
    const local = document.querySelector('section[aria-labelledby="local-pickup"]');
    expect(local).not.toBeNull();
    localSections.push(local!.textContent || '');
    expect(local!.querySelector('a[href^="https://"]')).not.toBeNull();
    expect(document.querySelector('form')).not.toBeNull();
    expect(document.body.textContent).toContain('Your guaranteed offer holds when the vehicle condition, missing parts and ownership details match');
    expect(document.body.textContent).toContain('A car left on your property is not automatically yours to sell');
    const metadata = await generateMetadata({ params: Promise.resolve({ city }) });
    expect(metadata.alternates?.canonical).toBe(`https://junkerz.com/cash-for-junk-cars/${city}`);
  }
  expect(localSections[0]).not.toBe(localSections[1]);
});
