import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

// George 11-18: a won car is like an auction win — no Decline on the list,
// and "Mark complete & pay" sits next to "Open pickup checklist" and confirms first.
const pickupComplete = vi.fn(async (_id: number) => ({ ok: true, charge_status: 'paid', spread_cents: 48000, seller_signed: false }));
vi.mock('@/lib/buyer-api', () => ({
  buyerApi: {
    wonCars: async () => [{ match_id: 3441, status: 'won', bid_cents: 100000, offer_cents: 52000, finder_fee_cents: 48000, year: 2018, make: 'FORD', model: 'F-150' }],
    pickupComplete: (id: number) => pickupComplete(id),
  },
}));
import WonCars from '@/app/(site)/buyers/won-cars/page';

afterEach(() => { cleanup(); pickupComplete.mockClear(); vi.restoreAllMocks(); });

test('won car list has no Decline button', async () => {
  render(<WonCars />);
  await screen.findByRole('link', { name: 'Open pickup checklist' });
  expect(screen.queryByRole('button', { name: 'Decline' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Mark complete & pay' })).toBeTruthy();
});

test('Mark complete & pay asks first, then completes and shows the fee paid', async () => {
  const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<WonCars />);
  fireEvent.click(await screen.findByRole('button', { name: 'Mark complete & pay' }));
  expect(confirmSpy).toHaveBeenCalledTimes(1);
  expect(String(confirmSpy.mock.calls[0][0])).toContain('$480.00');
  expect(await screen.findByText(/marked complete\. Finder fee paid: \$480\.00/)).toBeTruthy();
  expect(pickupComplete).toHaveBeenCalledWith(3441);
});

test('saying no to the confirm sends nothing', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<WonCars />);
  fireEvent.click(await screen.findByRole('button', { name: 'Mark complete & pay' }));
  expect(pickupComplete).not.toHaveBeenCalled();
});
