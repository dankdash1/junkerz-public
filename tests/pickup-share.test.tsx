import React from 'react';
import {afterEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PickupShare from '@/components/junkerz/PickupShare';
const api=vi.hoisted(()=>({createPickupAccessLink:vi.fn(),revokePickupAccessLink:vi.fn()}));
vi.mock('@/lib/buyer-api',()=>({buyerApi:api}));
afterEach(()=>{cleanup();vi.resetAllMocks();});
test('office explicitly creates a pickup-only forwarding link without displaying secret in page',async()=>{
 api.createPickupAccessLink.mockResolvedValue({url:'https://junkerz.com/pickup#token=cap-secret',expires_at:'2026-09-20T12:00:00Z'});
 render(<PickupShare matchId={42}/>);
 expect(api.createPickupAccessLink).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Create / replace pickup link'}));
 expect(api.createPickupAccessLink).toHaveBeenCalledWith(42);
 expect(await screen.findByRole('button',{name:'Share pickup link'})).toBeTruthy();
 expect(document.body.textContent).not.toContain('cap-secret');
});
test('failure to create link displays an error without a share action',async()=>{
 api.createPickupAccessLink.mockRejectedValue(new Error('Pickup sharing is unavailable'));
 render(<PickupShare matchId={42}/>);
 await userEvent.click(screen.getByRole('button',{name:'Create / replace pickup link'}));
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','Pickup sharing is unavailable');
 expect(screen.queryByRole('button',{name:'Share pickup link'})).toBeNull();
});
test('completed pickups retain disable access without offering creation or sharing',async()=>{
 api.revokePickupAccessLink.mockResolvedValue({ok:true});
 render(<PickupShare matchId={42} completed/>);
 expect(screen.getByText('Driver link access')).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Create / replace pickup link'})).toBeNull();
 expect(screen.queryByRole('button',{name:'Share pickup link'})).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Disable pickup link'}));
 expect(api.revokePickupAccessLink).toHaveBeenCalledWith(42);
 expect(await screen.findByText('Pickup link disabled. Every forwarded copy is now unavailable.')).toBeTruthy();
});
