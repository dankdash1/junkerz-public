import React from 'react';
import {cleanup, render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, expect, test, vi} from 'vitest';
import {SupplierReplyPanel} from '@/components/YardTokenViews';

afterEach(cleanup);

test('signed-in supplier reads existing cost and sends a revisioned reply without an email link', async () => {
  window.history.replaceState({}, '', '/buyers/parts-requests?request=fixture-request');
  const request = {reference: 'JR-FIXTURE', status: 'available', revision: 2, supplier_price_cents: 2500};
  const load = vi.fn().mockResolvedValue({request});
  const reply = vi.fn()
    .mockRejectedValueOnce(new Error('Temporary outage'))
    .mockResolvedValueOnce({request: {...request, revision: 3, supplier_price_cents: 2800}});
  const saved = vi.fn();
  render(<SupplierReplyPanel requestId="fixture-request" loadSupplier={load} reply={reply} onSaved={saved}/>);
  const cost = await screen.findByLabelText('Supplier price (USD)') as HTMLInputElement;
  expect(load).toHaveBeenCalledWith('fixture-request');
  expect(cost.value).toEqual('25.00');
  await userEvent.clear(cost);
  await userEvent.type(cost, '28.00');
  const send = screen.getByRole('button', {name: 'Send yard response'});
  await userEvent.click(send);
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Temporary outage');
  expect(cost.value).toEqual('28.00');
  expect(saved).not.toHaveBeenCalled();
  await userEvent.click(send);
  expect(await screen.findByText(/yard response saved/i)).toBeTruthy();
  expect(reply).toHaveBeenLastCalledWith('fixture-request', expect.objectContaining({
    expected_revision: 2, status: 'available', supplier_price_cents: 2800,
  }));
  expect(saved).toHaveBeenCalledTimes(1);
});
