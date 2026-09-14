import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CarPartsShop from '@/components/CarPartsShop';
import { ShopCartProvider } from '@/components/ShopCart';
import { CustomerRequestStatus, SupplierReplyPanel } from '@/components/YardTokenViews';
import { createYardRequestAttempt, submitYardRequest, tokenFromFragment } from '@/lib/yard-requests';

afterEach(cleanup);

const settings = {
  sections: { parts: 'live', cars_for_parts: 'live', cars_for_sale: 'live' } as const,
  parts_fulfillment: 'delivery_only' as const,
  checkout_enabled: false as const,
};

const renderShop = (component: React.ReactNode) => render(<ShopCartProvider>{component}</ShopCartProvider>);

test('a live donor listing opens a stock-specific request form when intake is enabled', async () => {
  renderShop(<CarPartsShop
    products={[{ key: 'parts-car:8', id: 8, carId: 8, href: '/parts/2HGCM82633A004353', name: '2017 Honda Civic', kind: 'parts-car', section: 'cars_for_parts', priceCents: null, image: null, detail: 'Vehicle available for parts', maxQuantity: 1 }]}
    settings={settings}
    requestIntakeEnabled
    settingsUnavailable={false}
    unavailable={false}
  />);

  await userEvent.click(screen.getByRole('button', { name: 'Request a part from this car' }));
  expect(screen.getByRole('dialog', { name: 'Request a part from this car' })).toBeTruthy();
  expect(screen.getByLabelText('Part or component')).toBeTruthy();
});

test('request dialog takes focus, closes with Escape, and returns focus to its trigger', async () => {
  renderShop(<CarPartsShop
    products={[{ key: 'part:9', id: 9, carId: 8, href: '/parts-inventory/9', name: 'Alternator', kind: 'part', section: 'parts', priceCents: null, image: null, detail: 'Good', maxQuantity: 1 }]}
    settings={settings}
    requestIntakeEnabled
    settingsUnavailable={false}
    unavailable={false}
  />);
  const trigger = screen.getByRole('button', { name: 'Request this part / arrange pickup' });
  await userEvent.click(trigger);
  expect(document.activeElement).toBe(screen.getByLabelText('Your name'));
  await userEvent.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
});

test('request intake failure stays visible and the same pending submission can be retried', async () => {
  const submitRequest = vi.fn()
    .mockRejectedValueOnce(Object.assign(new Error('Connection interrupted'), { ambiguous: true }))
    .mockResolvedValueOnce({ request: { reference: 'YR-100', status: 'received' }, status_url: '/yard-request#token=abc', message: 'Received' });
  renderShop(<CarPartsShop
    products={[{ key: 'part:9', id: 9, carId: 8, href: '/parts-inventory/9', name: 'Alternator', kind: 'part', section: 'parts', priceCents: null, image: null, detail: 'Good', maxQuantity: 1 }]}
    settings={settings}
    requestIntakeEnabled
    submitRequest={submitRequest}
    settingsUnavailable={false}
    unavailable={false}
  />);

  await userEvent.click(screen.getByRole('button', { name: 'Request this part / arrange pickup' }));
  await userEvent.type(screen.getByLabelText('Your name'), 'Sam Rivera');
  await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Connection interrupted');
  await userEvent.click(screen.getByRole('button', { name: 'Retry same request' }));
  await waitFor(() => expect(submitRequest).toHaveBeenCalledTimes(2));
  expect(submitRequest.mock.calls[1][0]).toBe(submitRequest.mock.calls[0][0]);
  expect(await screen.findByText('Request YR-100 received')).toBeTruthy();
});

test('an individual part request sends only its canonical part ID', async () => {
  const submitRequest = vi.fn().mockResolvedValue({ request: { reference: 'YR-101', status: 'received' }, status_url: '/yard-request#token=abc', message: 'Received' });
  renderShop(<CarPartsShop
    products={[{ key: 'part:9', id: 9, carId: 8, href: '/parts-inventory/9', name: 'Alternator', kind: 'part', section: 'parts', priceCents: null, image: null, detail: 'Good', maxQuantity: 1 }]}
    settings={settings}
    requestIntakeEnabled
    submitRequest={submitRequest}
    settingsUnavailable={false}
    unavailable={false}
  />);
  await userEvent.click(screen.getByRole('button', { name: 'Request this part / arrange pickup' }));
  await userEvent.type(screen.getByLabelText('Your name'), 'Sam Rivera');
  await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Send request' }));
  await waitFor(() => expect(submitRequest).toHaveBeenCalledOnce());
  expect(submitRequest.mock.calls[0][0].body).toMatchObject({ kind: 'part', part_id: 9 });
  expect(submitRequest.mock.calls[0][0].body).not.toHaveProperty('car_id');
});

test('request actions stay absent when request intake is off', () => {
  renderShop(<CarPartsShop
    products={[{ key: 'part:9', id: 9, carId: 8, href: '/parts-inventory/9', name: 'Alternator', kind: 'part', section: 'parts', priceCents: null, image: null, detail: 'Good', maxQuantity: 1 }]}
    settings={settings}
    requestIntakeEnabled={false}
    settingsUnavailable={false}
    unavailable={false}
  />);
  expect(screen.queryByRole('button', { name: /request this part/i })).toBeNull();
});

test('two submit events before the response create only one request attempt', async () => {
  let release!: (value: unknown) => void;
  const submitRequest = vi.fn(() => new Promise((resolve) => { release = resolve; }));
  renderShop(<CarPartsShop products={[{ key: 'part:9', id: 9, carId: 8, href: '/parts-inventory/9', name: 'Alternator', kind: 'part', section: 'parts', priceCents: null, image: null, detail: 'Good', maxQuantity: 1 }]} settings={settings} requestIntakeEnabled submitRequest={submitRequest as never} settingsUnavailable={false} unavailable={false} />);
  await userEvent.click(screen.getByRole('button', { name: 'Request this part / arrange pickup' }));
  await userEvent.type(screen.getByLabelText('Your name'), 'Sam Rivera');
  await userEvent.type(screen.getByLabelText('Email'), 'sam@example.com');
  const form = screen.getByRole('button', { name: 'Send request' }).closest('form')!;
  fireEvent.submit(form); fireEvent.submit(form);
  expect(submitRequest).toHaveBeenCalledTimes(1);
  release({ request: { reference: 'YR-9', status: 'received' }, status_url: '/yard-request#token=abc', message: 'Received' });
});

test('an ambiguous transport retry sends the exact same UUID and body bytes', async () => {
  const bodies: string[] = [];
  const attempt = createYardRequestAttempt({ kind: 'part', part_id: 9, customer_name: 'Sam', customer_email: 'sam@example.com' });
  const fetchImpl = vi.fn(async (_url: string | URL | Request, options?: RequestInit) => {
    bodies.push(String(options?.body));
    if (bodies.length === 1) throw new TypeError('network lost');
    return Response.json({ request: { reference: 'YR-9', status: 'received' }, status_url: '/yard-request#token=abc', message: 'Received' });
  });
  await expect(submitYardRequest(attempt, fetchImpl as typeof fetch)).rejects.toMatchObject({ ambiguous: true });
  await submitYardRequest(attempt, fetchImpl as typeof fetch);
  expect(bodies[1]).toBe(bodies[0]);
  expect(JSON.parse(bodies[0]).idempotency_key).toMatch(/^[0-9a-f-]{36}$/i);
  expect(tokenFromFragment('#token=supplier-secret')).toBe('supplier-secret');
  expect(tokenFromFragment('?token=must-not-read')).toBe('');
});

test('customer status renders only the customer projection from a fragment token', async () => {
  window.history.replaceState({}, '', '/yard-request');
  window.location.hash = 'token=customer-secret';
  const loadStatus = vi.fn().mockResolvedValue({ request: { reference: 'YR-22', status: 'available', vehicle_label: '2017 Honda Civic', component: 'Alternator', customer_message: 'We are confirming fitment.', updated_at: '2026-09-14T12:00:00Z', supplier_price_cents: 1200 } });
  render(<CustomerRequestStatus loadStatus={loadStatus} />);
  expect(await screen.findByText('YR-22')).toBeTruthy();
  expect(screen.getByText('We are confirming fitment.')).toBeTruthy();
  expect(screen.queryByText('$12.00')).toBeNull();
  expect(loadStatus).toHaveBeenCalledWith('customer-secret');
});

test('payment starts only for an ordered request the server marks payable', async () => {
  window.history.replaceState({}, '', '/yard-request');
  window.location.hash = 'token=customer-secret';
  const loadStatus = vi.fn().mockResolvedValue({ request: { reference: 'YR-24', status: 'ordered', order_id: 81, payment_status: 'pending', payment_available: true, retail_price_cents: 27500 } });
  const startPayment = vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay' });
  const navigate = vi.fn();
  render(<CustomerRequestStatus loadStatus={loadStatus} startPayment={startPayment} navigate={navigate} />);
  await userEvent.click(await screen.findByRole('button', { name: 'Pay confirmed order' }));
  expect(screen.getByText('$275.00')).toBeTruthy();
  expect(startPayment).toHaveBeenCalledWith('customer-secret');
  expect(navigate).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay');
  expect(screen.queryByText(/payment complete/i)).toBeNull();
});

test.each([
  ['paid', 'Payment confirmed. Delivery completed.'],
  ['refunded', 'Payment refunded. Contact Junkerz if you need help with this order.'],
])('customer order banner reflects the verified %s payment state', async (paymentStatus, message) => {
  window.history.replaceState({}, '', '/yard-request');
  window.location.hash = 'token=customer-secret';
  const loadStatus = vi.fn().mockResolvedValue({ request: { reference: 'YR-26', status: 'ordered', order_id: 82, order_status: 'delivered', payment_status: paymentStatus, payment_available: false } });
  render(<CustomerRequestStatus loadStatus={loadStatus} />);
  expect(await screen.findByText(message)).toBeTruthy();
  expect(screen.getByText('Delivery status: Delivered')).toBeTruthy();
  expect(screen.queryByText(/will arrange delivery/i)).toBeNull();
  expect(screen.queryByText(/an unpaid order has been prepared/i)).toBeNull();
});

test('a stale supplier reply reloads the current revision and keeps the conflict visible', async () => {
  window.history.replaceState({}, '', '/yard-reply');
  window.location.hash = 'token=supplier-secret';
  const loadSupplier = vi.fn()
    .mockResolvedValueOnce({ request: { reference: 'YR-23', status: 'sent_to_yard', revision: 3, vehicle_label: '2017 Honda Civic', component: 'Starter', target_vehicle: '2016 Civic', car_id: 8, vin: '2HGCM82633A004353', yard_location: 'Row B · Space 12' } })
    .mockResolvedValueOnce({ request: { reference: 'YR-23', status: 'available', revision: 4, vehicle_label: '2017 Honda Civic', component: 'Starter', target_vehicle: '2016 Civic', car_id: 8, vin: '2HGCM82633A004353', yard_location: 'Row B · Space 12', part_number: 'NEW-2', condition: 'Excellent', supplier_price_cents: 15500, supplier_notes: 'Fresh server note' } });
  const reply = vi.fn().mockRejectedValue(Object.assign(new Error('Request changed'), { status: 409 }));
  render(<SupplierReplyPanel loadSupplier={loadSupplier} reply={reply} />);
  expect(await screen.findByText('2HGCM82633A004353')).toBeTruthy();
  await userEvent.selectOptions(screen.getByLabelText('Response'), 'available');
  await userEvent.type(screen.getByLabelText('Actual part number'), 'OLD-1');
  await userEvent.type(screen.getByLabelText('Condition'), 'Good');
  await userEvent.type(screen.getByLabelText('Supplier price (USD)'), '100.00');
  await userEvent.type(screen.getByLabelText('Yard notes'), 'Stale local note');
  await userEvent.click(screen.getByRole('button', { name: 'Send yard response' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringMatching(/changed.*reloaded/i));
  expect(reply.mock.calls[0][1]).toMatchObject({ expected_revision: 3, status: 'available' });
  expect(loadSupplier).toHaveBeenCalledTimes(2);
  expect((screen.getByLabelText('Actual part number') as HTMLInputElement).value).toBe('NEW-2');
  expect((screen.getByLabelText('Condition') as HTMLInputElement).value).toBe('Excellent');
  expect((screen.getByLabelText('Supplier price (USD)') as HTMLInputElement).value).toBe('155.00');
  expect((screen.getByLabelText('Yard notes') as HTMLTextAreaElement).value).toBe('Fresh server note');
});

test('an ordered supplier request offers only the readiness transition', async () => {
  window.history.replaceState({}, '', '/yard-reply');
  window.location.hash = 'token=supplier-secret';
  const loadSupplier = vi.fn().mockResolvedValue({ request: { reference: 'YR-27', status: 'ordered', revision: 6, vehicle_label: '2017 Honda Civic', component: 'Starter' } });
  const reply = vi.fn().mockResolvedValue({ request: { reference: 'YR-27', status: 'ready_for_pickup', revision: 7 } });
  render(<SupplierReplyPanel loadSupplier={loadSupplier} reply={reply} />);
  const response = await screen.findByLabelText('Response') as HTMLSelectElement;
  expect(Array.from(response.options).map((option) => option.value)).toEqual(['ready_for_pickup']);
  expect((screen.getByLabelText('Actual part number') as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText('Condition') as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText('Supplier price (USD)') as HTMLInputElement).disabled).toBe(true);
  expect((screen.getByLabelText('Preparation / pickup window') as HTMLInputElement).disabled).toBe(false);
  await userEvent.click(screen.getByRole('button', { name: 'Send yard response' }));
  expect(reply.mock.calls[0][1]).toMatchObject({ expected_revision: 6, status: 'ready_for_pickup' });
});
