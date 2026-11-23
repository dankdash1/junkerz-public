import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfferResponseForm from '../src/app/(site)/offer-response/[token]/OfferResponseForm';

vi.mock('@/lib/site', async (load) => ({ ...await load<typeof import('@/lib/site')>(), PICKUPS_LIVE: true }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it('keeps acceptance available while a seller shares successive outside offers', async () => {
  const fetchMock = vi.fn(async (_url: string, options?: RequestInit) => options?.method === 'POST'
    ? Response.json({ ok: true })
    : Response.json({ vehicle: '2012 Honda Civic', offer_cents: 40050, requested_details: [] }));
  vi.stubGlobal('fetch', fetchMock);
  const user = userEvent.setup();
  render(<OfferResponseForm token="fixture-token" es={false} />);
  const approve = await screen.findByRole('link', { name: 'Accept & schedule pickup' });
  const share = screen.getByRole('button', { name: 'Share another offer' });
  expect(approve.getAttribute('href')).toBe('/schedule/fixture-token');
  expect(approve.compareDocumentPosition(share) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText('$400.50')).toBeTruthy();
  await user.click(share);
  await user.type(screen.getByLabelText('Other company'), 'Outside Yard');
  await user.type(screen.getByLabelText('Their cash offer in dollars'), '575.25');
  await user.click(screen.getByRole('button', { name: 'Send to Junkerz' }));
  await screen.findByText(/Your original offer is still available/);
  const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST');
  const form = post?.[1]?.body as FormData;
  expect(post?.[0]).toBe('/api/public/junkerz/seller/check-in/fixture-token');
  expect(form.get('kind')).toBe('outside_offer');
  expect(form.get('company')).toBe('Outside Yard');
  expect(form.get('amount')).toBe('575.25');
  expect(form.get('request_key')).toMatch(/^[\da-f-]{36}$/);
  await user.click(screen.getByRole('button', { name: 'Add another offer' }));
  expect((screen.getByLabelText('Other company') as HTMLInputElement).value).toBe('');
  expect(screen.getByRole('link', { name: 'Decline offer' }).getAttribute('href')).toBe('/decline/fixture-token');
});
