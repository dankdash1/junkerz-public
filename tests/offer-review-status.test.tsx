import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ResultPage from '@/app/(site)/quote/result/page';

const state = vi.hoisted(() => ({ query: '', getOffer: vi.fn() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(state.query) }));
vi.mock('@/lib/api', () => ({ getOffer: state.getOffer }));
beforeEach(() => {
  state.query = 'id=42&status=reviewing&cents=45000&token=test-token&review=1';
  state.getOffer.mockReset();
});
afterEach(() => cleanup());

it('does not turn a held quote into a guarantee from a legacy ready response', async () => {
  state.getOffer.mockResolvedValue({status: 'ready', offer_cents: 45000});
  render(<ResultPage />);
  await act(async () => { await Promise.resolve(); });
  expect(state.getOffer).toHaveBeenCalledWith(42);
  expect(screen.queryByText(/Your offer is guaranteed/)).toBeNull();
  expect(screen.getByText('One of our team is confirming this number now.')).toBeTruthy();
  expect(screen.getByRole('link', {name: 'Accept & schedule pickup'}).getAttribute('href')).toBe('/schedule/test-token');
});

it('shows the conditional guarantee when the server explicitly clears review', async () => {
  state.getOffer.mockResolvedValue({status: 'ready', offer_cents: 45000, requires_human_approval: false});
  render(<ResultPage />);
  await screen.findByText(/Your offer is guaranteed when the vehicle/);
});

it('preserves acceptance without treating seller acceptance as buyer approval', async () => {
  state.getOffer.mockResolvedValue({status: 'seller_accepted', offer_cents: 45000});
  render(<ResultPage />);
  await screen.findByText(/You accepted this offer. Your buyer will confirm/);
  expect(screen.queryByText(/Your offer is guaranteed/)).toBeNull();
});

it('keeps an explicitly held response pending even if its status says ready', async () => {
  state.query = 'id=42&status=ready&cents=45000&token=test-token';
  state.getOffer.mockResolvedValue({status: 'ready', offer_cents: 45000, requires_human_approval: true});
  render(<ResultPage />);
  await screen.findByText('One of our team is confirming this number now.');
  expect(screen.queryByText(/Your offer is guaranteed/)).toBeNull();
});
