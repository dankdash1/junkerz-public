import { chromium } from 'playwright';
import assert from 'node:assert/strict';

// Run against a local build: npm run start -- --port 3127
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
let shown = false, plates = false, lookupCount = 0, fail = false;
await page.route('**/api/**', async route => {
  const url = new URL(route.request().url());
  let data = {};
  if (url.pathname.endsWith('/vehicle-lookup/config')) data = { enabled: shown, plate_available: plates };
  else if (url.pathname.endsWith('/vehicle-lookup')) {
    lookupCount++;
    if (fail) return route.fulfill({ status: 404, json: { status: 'not_found' } });
    const input = route.request().postDataJSON();
    if (input.plate) assert.equal(input.state, 'OK');
    data = { status: 'ok', vehicle: { vin: '3VWFE21C04M000004', year: 2004, make: 'VOLKSWAGEN', model: 'Beetle', trim: 'Turbo S' }, vehicle_lookup_token: 'test-token' };
  } else if (url.pathname.endsWith('/years')) data = { years: [2004, 2007] };
  else if (url.pathname.includes('/makes/')) data = { makes: [{ id: 1, name: 'VOLKSWAGEN' }] };
  else if (url.pathname.endsWith('/models')) data = { models: [{ id: 2, name: 'Beetle' }] };
  await route.fulfill({ json: data });
});
try {
  await page.goto('http://localhost:3127/quote');
  await page.screenshot({ path: '/tmp/junkerz-lookup-hidden.png', fullPage: true });
  assert.equal(await page.getByRole('heading', { name: 'Find your vehicle faster' }).count(), 0);
  shown = true;
  await page.reload();
  await page.getByRole('heading', { name: 'Find your vehicle faster' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'License plate', exact: true }).isDisabled(), true);
  await page.getByPlaceholder('17 characters').fill('3VWFE21C04M000004');
  await page.screenshot({ path: '/tmp/junkerz-lookup-vin.png', fullPage: true });
  await page.getByRole('button', { name: 'Find my vehicle', exact: true }).click();
  await page.getByText('Vehicle found. Confirm the details below.').waitFor();
  assert.equal(await page.locator('select').nth(0).inputValue(), '2004');
  assert.equal(await page.locator('select').nth(1).inputValue(), 'decoded');
  assert.equal(await page.locator('select').nth(2).inputValue(), 'decoded');
  assert.equal(await page.getByPlaceholder('e.g., LE, SE, Sport').inputValue(), 'Turbo S');
  assert.equal(await page.getByRole('button', {name: 'Continue', exact: true}).isEnabled(), true);
  await page.screenshot({ path: '/tmp/junkerz-lookup-filled.png', fullPage: true });
  plates = true;
  await page.reload();
  await page.getByRole('button', { name: 'License plate', exact: true }).click();
  await page.getByPlaceholder('ABC1234').fill('ABC123');
  await page.getByRole('combobox').first().selectOption('OK');
  await page.screenshot({ path: '/tmp/junkerz-lookup-plate.png', fullPage: true });
  await page.getByRole('button', { name: 'Find my vehicle', exact: true }).click();
  await page.getByText('Vehicle found. Confirm the details below.').waitFor();
  fail = true;
  await page.getByPlaceholder('ABC1234').fill('MISSING');
  await page.getByRole('button', { name: 'Find my vehicle', exact: true }).click();
  await page.getByText('We couldn’t find your vehicle. Check the details or enter them below.').waitFor();
  assert.equal(await page.locator('select').nth(1).inputValue(), '2004');
  await page.screenshot({ path: '/tmp/junkerz-lookup-not-found.png', fullPage: true });
  assert.equal(lookupCount, 3);
  console.log('PASS: hidden default, visible VIN, autofilled fields, unavailable plate, out-of-state plate, no-match preserves manual entry');
} finally { await browser.close(); }
