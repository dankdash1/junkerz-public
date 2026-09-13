import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentRecovery from '@/components/junkerz/PaymentRecovery';
const api = vi.hoisted(()=>({retryPickupPayment:vi.fn()}));
vi.mock('@/lib/buyer-api',()=>({buyerApi:api}));
afterEach(()=>{cleanup();vi.resetAllMocks();});
test('a reloaded declined pickup shows amount and allows explicit payment retry',async()=>{
 const refresh=vi.fn();
 api.retryPickupPayment.mockResolvedValue({charge_status:'paid',spread_cents:37000,invoice_id:123});
 render(<PaymentRecovery matchId={42} status="declined" cents={37000} invoiceId={123} onUpdated={refresh}/>);
 expect(screen.getByText(/\$370.00/)).toBeTruthy();
 expect(screen.getByText(/Invoice #123/)).toBeTruthy();
 expect(screen.getByRole('link',{name:'Update card'}).getAttribute('href')).toBe('/buyers/settings?return_to=42');
 await userEvent.click(screen.getByRole('button',{name:'Retry payment'}));
 expect(api.retryPickupPayment).toHaveBeenCalledWith(42);
 await waitFor(()=>expect(refresh).toHaveBeenCalledOnce());
 expect(screen.getByRole('status').textContent).toContain('paid');
});
test('a failed retry stays visible and never reports paid',async()=>{
 api.retryPickupPayment.mockRejectedValue(new Error('Payment service unavailable'));
 render(<PaymentRecovery matchId={42} status="pending" cents={37000} invoiceId={123} onUpdated={vi.fn()}/>);
 await userEvent.click(screen.getByRole('button',{name:'Retry payment'}));
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','Payment service unavailable');
 expect(screen.queryByText('Finder fee paid.')).toBeNull();
});
test('paid pickup does not offer another charge',()=>{
 render(<PaymentRecovery matchId={42} status="paid" cents={37000} invoiceId={123} onUpdated={vi.fn()}/>);
 expect(screen.queryByRole('button')).toBeNull();
 expect(screen.getByText('Finder fee paid.')).toBeTruthy();
});
