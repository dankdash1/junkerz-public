import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
afterEach(cleanup);
import WonCars from '@/app/buyers/won-cars/page';

// 2026-11-10 George: the company login sees bid = seller payout + finder fee
// before pickup, and an empty tab must not say "No matches yet".
const wonCars = vi.fn(async (status?: string) =>
  status ? [] : [{ match_id: 3502, status: 'won', bid_cents: 100000, offer_cents: 33000,
    finder_fee_cents: 67000, picked_up_charge_cents: null, year: 2008, make: 'Toyota', model: 'Corolla' }]);
vi.mock('@/lib/buyer-api', () => ({ buyerApi: { wonCars: (s?: string) => wonCars(s) } }));

test('shows seller payout and the finder fee due at pickup', async () => {
  render(<WonCars />);
  expect(await screen.findByText('Seller gets $330')).toBeTruthy();
  expect(screen.getByText('$670.00')).toBeTruthy();
  expect(screen.getByText('charged at pickup')).toBeTruthy();
});

test('an empty tab names the tab instead of "No matches yet"', async () => {
  render(<WonCars />);
  await screen.findByText('Seller gets $330');
  fireEvent.click(screen.getByRole('button', { name: 'Backup' }));
  expect(await screen.findByText(/No cars under Backup/)).toBeTruthy();
  expect(screen.queryByText(/No matches yet/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show all cars' }));
  expect(await screen.findByText('Seller gets $330')).toBeTruthy();
});
