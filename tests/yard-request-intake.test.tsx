import React from 'react';
import {afterEach, expect, test, vi} from 'vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import YardRequestForm from '@/components/YardRequestForm';
import YardRequestQuote from '@/components/YardRequestQuote';
import {depositTerm, getYardRequestOptions, parseRequestOptions, type RequestOptions, type YardRequestAttempt} from '@/lib/yard-requests';

afterEach(cleanup);

const OPTIONS: RequestOptions = {
  fulfillment_options: ['junkerz_pickup', 'delivery'],
  part_categories: [{key: 'headlight', label: 'Headlight'}, {key: 'door', label: 'Door'}, {key: 'other', label: 'Other'}],
  deposit_basis_points: 5000, hold_days: 30, deposit_refundable: false, balance_methods: ['online', 'cash_in_person'],
};
const donor = {kind: 'donor_part' as const, carId: 160, label: '2018 Chevrolet Silverado 1500'};
const receipt = {request: {reference: 'JR-1', status: 'received'}, status_url: '/yard-request#token=abc', message: 'Received'};

async function openForm(props: Partial<React.ComponentProps<typeof YardRequestForm>> = {}) {
  const submitRequest = vi.fn(async (_attempt: YardRequestAttempt) => receipt);
  render(<YardRequestForm target={donor} submitRequest={submitRequest} requestOptions={OPTIONS} {...props}/>);
  await userEvent.click(screen.getByRole('button', {name: 'Request a part from this car'}));
  await userEvent.type(screen.getByLabelText('Your name'), 'George');
  await userEvent.type(screen.getByLabelText('Email'), 'george@example.invalid');
  return submitRequest;
}
const send = () => fireEvent.submit(screen.getByRole('button', {name: 'Send request'}).closest('form')!);

test('parses only the customer-safe options and tolerates an older backend', async () => {
  expect(parseRequestOptions({enabled: true})).toBeNull();
  expect(parseRequestOptions({request_options: {...OPTIONS, fulfillment_options: ['ship']}})).toBeNull();
  const parsed = parseRequestOptions({enabled: true, part_markup: {basis_points: 5000}, request_options: {...OPTIONS, extra: 1}})!;
  expect(Object.keys(parsed).sort()).toEqual(['balance_methods', 'deposit_basis_points', 'deposit_refundable', 'fulfillment_options', 'hold_days', 'part_categories']);
  const fetchImpl = vi.fn(async () => new Response(JSON.stringify({enabled: true}), {status: 200}));
  expect(await getYardRequestOptions(fetchImpl as unknown as typeof fetch)).toBeNull();
  expect(await getYardRequestOptions((async () => { throw new Error('offline'); }) as unknown as typeof fetch)).toBeNull();
  expect(depositTerm({hold_days: 30, deposit_refundable: false})).toBe('Your deposit holds the part for 30 days. It is not refunded if you do not collect the part in that time.');
});

test('older backend: the form sends exactly the old fields', async () => {
  const submitRequest = await openForm({requestOptions: null});
  expect(screen.queryByText('Pickup or delivery')).toBeNull();
  await userEvent.type(screen.getByLabelText('Part or component'), 'Driver headlight');
  send();
  await waitFor(() => expect(submitRequest).toHaveBeenCalledOnce());
  expect(Object.keys(JSON.parse(submitRequest.mock.calls[0][0].serializedBody)).sort()).toEqual(['car_id', 'component', 'customer_email', 'customer_name', 'idempotency_key', 'kind']);
});

test('pickup needs no address and sends category, side and choice', async () => {
  const submitRequest = await openForm();
  expect(screen.getByText(/50% deposit is due first/)).toBeTruthy();
  expect(screen.getByText(/not refunded if you do not collect the part/)).toBeTruthy();
  await userEvent.selectOptions(screen.getByLabelText('Part you need'), 'headlight');
  await userEvent.selectOptions(screen.getByLabelText('Side (optional)'), 'driver');
  await userEvent.click(screen.getByLabelText('I will collect it from Junkerz'));
  expect(screen.queryByLabelText('Street address')).toBeNull();
  send();
  await waitFor(() => expect(submitRequest).toHaveBeenCalledOnce());
  const body = submitRequest.mock.calls[0][0].body;
  expect(body).toMatchObject({part_category: 'headlight', part_side: 'driver', fulfillment_method: 'junkerz_pickup'});
  expect(body.delivery_address).toBeUndefined();
  expect(body.component).toBeUndefined();
});

test('delivery asks for and requires the address', async () => {
  const submitRequest = await openForm();
  await userEvent.selectOptions(screen.getByLabelText('Part you need'), 'door');
  await userEvent.click(screen.getByLabelText('Deliver it to me'));
  send();
  expect((await screen.findByRole('alert')).textContent).toMatch(/full delivery address/);
  expect(submitRequest).not.toHaveBeenCalled();
  await userEvent.type(screen.getByLabelText('Street address'), '1 Main St');
  await userEvent.type(screen.getByLabelText('City'), 'Dallas');
  await userEvent.type(screen.getByLabelText('State'), 'TX');
  await userEvent.type(screen.getByLabelText('ZIP code'), '75201');
  send();
  await waitFor(() => expect(submitRequest).toHaveBeenCalledOnce());
  expect(submitRequest.mock.calls[0][0].body.delivery_address).toEqual({street: '1 Main St', city: 'Dallas', state: 'TX', postal_code: '75201'});
});

test('a one-letter part and an undescribed "Other" are refused before sending', async () => {
  const submitRequest = await openForm();
  await userEvent.selectOptions(screen.getByLabelText('Part you need'), 'other');
  await userEvent.click(screen.getByLabelText('I will collect it from Junkerz'));
  send();
  expect((await screen.findByRole('alert')).textContent).toMatch(/at least 3 characters/);
  await userEvent.type(screen.getByLabelText('Describe the part'), 'c');
  send();
  expect(screen.getByRole('alert').textContent).toMatch(/at least 3 characters/);
  expect(submitRequest).not.toHaveBeenCalled();
});

test('a single enabled option is preselected and shown as text', async () => {
  const submitRequest = await openForm({requestOptions: {...OPTIONS, fulfillment_options: ['junkerz_pickup']}});
  expect(screen.getByText('I will collect it from Junkerz')).toBeTruthy();
  expect(screen.queryByRole('radio')).toBeNull();
  await userEvent.selectOptions(screen.getByLabelText('Part you need'), 'door');
  send();
  await waitFor(() => expect(submitRequest).toHaveBeenCalledOnce());
  expect(submitRequest.mock.calls[0][0].body.fulfillment_method).toBe('junkerz_pickup');
});

const quote = {id: 'q1', request_id: 'r1', version: 1, status: 'published', part_id: 43, quantity: 1, item_price_cents: 3750, delivery_cents: 0, tax_cents: 0, fees_cents: 0,
  total_cents: 3750, currency: 'usd', condition: 'Good', fitment: 'Confirm fitment.', delivery_address: {collection: 'Collect from Junkerz'}, delivery_terms: 'Collect it.',
  return_terms: '7 days', core_terms: 'No core', expires_at: '2099-01-01T00:00:00Z', fulfillment_method: 'junkerz_pickup' as const, deposit_basis_points: 5000,
  deposit_cents: 1875, balance_cents: 1875, hold_days: 30, deposit_refundable: false, balance_methods: ['online', 'cash_in_person']};

test('customer quote shows deposit, balance at collection, hold term and no yard details', async () => {
  render(<YardRequestQuote loadQuote={async () => ({quote})} respond={async () => ({quote})}/>);
  expect(await screen.findByText('Deposit due now')).toBeTruthy();
  expect(screen.getAllByText('$18.75')).toHaveLength(2);
  expect(screen.getByText('Balance due at collection')).toBeTruthy();
  expect(screen.getByText('Your deposit holds the part for 30 days. It is not refunded if you do not collect the part in that time.')).toBeTruthy();
  expect(screen.getByText('You collect the part from Junkerz.')).toBeTruthy();
  expect(screen.getByText(/Collect from Junkerz/)).toBeTruthy();
  expect(screen.queryByText('Delivery')).toBeNull();
  expect(screen.getByText(/pay the balance online or in cash in person/)).toBeTruthy();
});

test('an older quote without a deposit still renders as before', async () => {
  const old = {...quote, delivery_address: {street: '456 Buyer Ave', city: 'OKC', state: 'OK', postal_code: '73102'}, delivery_cents: 1500, total_cents: 5250,
    fulfillment_method: undefined, deposit_cents: undefined, balance_cents: undefined, hold_days: undefined, deposit_refundable: undefined, balance_methods: undefined, deposit_basis_points: undefined};
  render(<YardRequestQuote loadQuote={async () => ({quote: old})} respond={async () => ({quote: old})}/>);
  expect(await screen.findByText('$52.50')).toBeTruthy();
  expect(screen.queryByText('Deposit due now')).toBeNull();
  expect(screen.getByText(/456 Buyer Ave, OKC, OK, 73102/)).toBeTruthy();
});
