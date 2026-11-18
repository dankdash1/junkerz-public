import React from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// George 11-18: Picked Up cars show "Mark complete & pay" until the fee is paid.
vi.mock('@/lib/buyer-api', () => ({
  buyerApi: {
    wonCars: async () => [
      { match_id: 1, status: 'delivered', picked_up_charge_status: 'pending', picked_up_charge_cents: 48000, bid_cents: 100000, year: 2016, make: 'FORD', model: 'F-150' },
      { match_id: 2, status: 'delivered', picked_up_charge_status: 'paid', picked_up_charge_cents: 48000, bid_cents: 100000, year: 2018, make: 'FORD', model: 'F-150' },
    ],
    pickupComplete: vi.fn(),
  },
}));
import WonCars from '@/app/(site)/buyers/won-cars/page';

test('only the unpaid Picked Up car gets Mark complete & pay', async () => {
  render(<WonCars />);
  const buttons = await screen.findAllByRole('button', { name: 'Mark complete & pay' });
  expect(buttons).toHaveLength(1);
  const links = screen.getAllByRole('link', { name: 'Open pickup checklist' });
  expect(links.map((l) => l.getAttribute('href'))).toEqual(['/buyers/won-cars/1']);
  expect(screen.getByText('✓ Paid')).toBeTruthy();
});
