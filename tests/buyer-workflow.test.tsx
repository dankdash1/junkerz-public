import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentSettings from '@/app/buyers/settings/page';
import PickupStart from '@/components/junkerz/PickupStart';
const api = vi.hoisted(() => ({ paymentMethod: vi.fn(), createPaymentSetup: vi.fn(), savePaymentMethod: vi.fn(), startPickup: vi.fn() }));
const confirmSetup = vi.hoisted(() => vi.fn());
vi.mock('@/lib/buyer-api', () => ({ buyerApi: api }));
vi.mock('@stripe/stripe-js', () => ({ loadStripe: () => Promise.resolve({}) }));
vi.mock('@stripe/react-stripe-js', () => ({ Elements: ({children}: {children: React.ReactNode}) => <>{children}</>, PaymentElement: () => <div>Secure card fields</div>, useStripe: () => ({confirmSetup}), useElements: () => ({}) }));
beforeEach(() => { vi.resetAllMocks(); window.history.replaceState({}, '', '/buyers/settings'); api.paymentMethod.mockResolvedValue({has_payment_method:false,card:null,auto_pay_enabled:false}); api.createPaymentSetup.mockResolvedValue({client_secret:'seti_secret',publishable_key:'pk_test_123'}); });
afterEach(cleanup);
test('saves a card only after Stripe confirmation and server verification', async () => {
 confirmSetup.mockResolvedValue({setupIntent:{id:'seti_123',status:'succeeded'}});
 api.savePaymentMethod.mockRejectedValueOnce(new Error('verification failed'));
 render(<PaymentSettings/>);
 await userEvent.click(await screen.findByRole('button',{name:'Add card'}));
 await userEvent.click(await screen.findByLabelText(/authorize Junkerz/));
 await userEvent.click(screen.getByRole('button',{name:'Save card'}));
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','verification failed');
 expect(screen.queryByText('Card saved.')).toBeNull();
 api.savePaymentMethod.mockResolvedValueOnce({ok:true});
 await userEvent.click(screen.getByRole('button',{name:'Save card'}));
 expect(await screen.findByText('Card saved.')).toBeTruthy();
 expect(api.savePaymentMethod).toHaveBeenCalledWith('seti_123');
});
test('keeps Stripe authentication errors visible without saving', async () => {
 confirmSetup.mockResolvedValue({error:{message:'Authentication failed'}});
 render(<PaymentSettings/>);
 await userEvent.click(await screen.findByRole('button',{name:'Add card'}));
 await userEvent.click(await screen.findByLabelText(/authorize Junkerz/));
 await userEvent.click(screen.getByRole('button',{name:'Save card'}));
 expect(await screen.findByText('Authentication failed')).toBeTruthy();
 expect(api.savePaymentMethod).not.toHaveBeenCalled();
});
test('on-the-way sends buyer ETA and shows success only after response', async () => {
 api.startPickup.mockRejectedValueOnce(new Error('Pickup cancelled'));
 const refresh = vi.fn();
 render(<PickupStart matchId={42} status="scheduled" etaAt={null} onStarted={refresh}/>);
 await userEvent.click(screen.getByRole('button',{name:"I'm on my way"}));
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','Pickup cancelled');
 expect(refresh).not.toHaveBeenCalled();
 api.startPickup.mockResolvedValueOnce({ok:true,status:'en_route',eta_at:'2026-09-13T12:30:00Z'});
 await userEvent.click(screen.getByRole('button',{name:"I'm on my way"}));
 await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
 expect(api.startPickup).toHaveBeenCalledWith(42,30);
});
test('completed pickup does not offer departure', () => { render(<PickupStart matchId={42} status="completed" etaAt={null} onStarted={vi.fn()}/>); expect(screen.queryByRole('button')).toBeNull(); });
test('setup service errors allow retry and never show empty card fields', async () => {
 api.createPaymentSetup.mockRejectedValueOnce(new Error('Stripe is unavailable'));
 render(<PaymentSettings/>);
 await userEvent.click(await screen.findByRole('button',{name:'Add card'}));
 expect(await screen.findByText('Stripe is unavailable')).toBeTruthy();
 expect(screen.queryByText('Secure card fields')).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Add card'}));
 expect(await screen.findByText('Secure card fields')).toBeTruthy();
});
test('return URL intent is verified server-side before showing saved', async () => {
 window.history.replaceState({},'', '/buyers/settings?setup_intent=seti_return&setup_intent_client_secret=secret&redirect_status=succeeded');
 api.savePaymentMethod.mockRejectedValueOnce(new Error('intent_customer_mismatch'));
 render(<PaymentSettings/>);
 expect(await screen.findByText('intent_customer_mismatch')).toBeTruthy();
 expect(screen.queryByText('Card saved.')).toBeNull();
 expect(window.location.search).toBe('');
});

test('card settings keeps a safe return link to the outstanding pickup', async () => {
 window.history.replaceState({},'', '/buyers/settings?return_to=42');
 render(<PaymentSettings/>);
 expect((await screen.findByRole('link',{name:'Return to pickup to retry payment'})).getAttribute('href')).toBe('/buyers/won-cars/42');
});
