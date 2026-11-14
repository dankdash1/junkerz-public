import React from 'react';
import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import CatalogDetail from '@/components/CatalogDetail';
import type { CatalogSettings, ShopProduct } from '@/lib/shop-catalog';

// RSC exposes client-module exports as references that cannot be invoked on
// the server. jsdom alone does not enforce that boundary, so model it here.
vi.mock('@/components/CarPartsShop', () => ({
  money: () => { throw new Error('Cannot call a client export from the server'); },
}));
vi.mock('@/components/PageShell', () => ({ SiteHeader: () => <nav>Junkerz</nav> }));
vi.mock('@/components/YardRequestForm', () => ({ default: () => <div>Request availability</div> }));

const settings: CatalogSettings = { sections: { parts: 'live', cars_for_parts: 'live', cars_for_sale: 'live' }, parts_fulfillment: 'delivery_only', checkout_enabled: false };
const product: ShopProduct = { key: 'part:6', id: 6, carId: 27, href: '/parts-inventory/6', name: 'Transmission', kind: 'part', section: 'parts', priceCents: 95000, image: null, detail: 'Ford Mustang', maxQuantity: 1 };

it.each([
  ['part', 'parts', 95000, '$950.00'],
  ['parts-car', 'cars_for_parts', 75000, '$750.00'],
  ['car', 'cars_for_sale', null, 'Price requires confirmation'],
] as const)('renders %s details on the server without invoking a client export', (kind, section, priceCents, price) => {
  const html = renderToStaticMarkup(<CatalogDetail product={{ ...product, kind, section, priceCents }} settings={settings} requestIntakeEnabled={false} />);
  expect(html).toContain(price);
  expect(html).toContain('Transmission');
});
