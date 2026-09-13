import React from 'react';
import { afterEach,beforeEach,expect,test,vi } from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PickupMobile from '@/components/junkerz/PickupMobile';
const api=vi.hoisted(()=>({detail:vi.fn(),start:vi.fn(),thirtyMinutes:vi.fn(),complete:vi.fn(),signature:vi.fn(),upload:vi.fn(),photo:vi.fn()}));
vi.mock('@/lib/pickup-access-api',async(importOriginal)=>({...await importOriginal<typeof import('@/lib/pickup-access-api')>(),createPickupAccessApi:()=>api}));
vi.mock('@/components/junkerz/SignaturePad',()=>({default:({onChange}:{onChange:(s:string)=>void})=><button onClick={()=>onChange('data:image/png;base64,test')}>Test seller draws signature</button>}));
const detail={pickup_order_id:42,status:'scheduled',vehicle:{year:2010,make:'Honda',model:'Civic',vin:'TESTVIN',condition:'used'},seller:{name:'Test Seller',phone:null,email:null},pickup_address:'Test yard',slot:'September 14, 10am–12pm',eta_at:null,offer_cents:33000,photos:[],seller_signature:null,completed_at:null};
beforeEach(()=>{vi.resetAllMocks();window.history.replaceState({},'','/pickup#token=private-capability');api.detail.mockResolvedValue(detail);});
afterEach(cleanup);
test('driver can open one pickup without buyer login and must identify before departure',async()=>{
 render(<PickupMobile/>);
 expect(await screen.findByText('2010 Honda Civic')).toBeTruthy();
 expect(screen.getByText('September 14, 10am–12pm')).toBeTruthy();
 expect(screen.queryByText('Payment settings')).toBeNull();
 expect(screen.getByRole('button',{name:"I'm on my way"})).toHaveProperty('disabled',true);
 await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
 api.start.mockResolvedValue({ok:true});
 await userEvent.click(screen.getByRole('button',{name:"I'm on my way"}));
 expect(api.start).toHaveBeenCalledWith('Test Driver',30);
});
test('driver cannot complete before seller signature and collection confirmation',async()=>{
 api.detail.mockResolvedValue({...detail,status:'en_route',seller_signature:{signer_name:'Test Seller',signed_at:'2026-09-13T12:00:00Z'}});
 render(<PickupMobile/>);await screen.findByText('2010 Honda Civic');
 await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
 expect(screen.getByRole('button',{name:'Pickup complete'})).toHaveProperty('disabled',true);
 await userEvent.click(screen.getByLabelText('The vehicle has been collected.'));
 api.complete.mockResolvedValue({ok:true});
 api.detail.mockResolvedValue({...detail,status:'completed',completed_at:'2026-09-13T12:30:00Z'});
 await userEvent.click(screen.getByRole('button',{name:'Pickup complete'}));
 await waitFor(()=>expect(api.complete).toHaveBeenCalledWith('Test Driver'));
 expect(await screen.findByText('Pickup completed')).toBeTruthy();
 expect(screen.queryByRole('button',{name:"I'm on my way"})).toBeNull();
});
test('missing capability shows recovery instructions without calling API',async()=>{
 window.history.replaceState({},'','/pickup');render(<PickupMobile/>);
 expect(await screen.findByText(/Open the complete pickup link/)).toBeTruthy();
 expect(api.detail).not.toHaveBeenCalled();
});
test('explicit thirty-minute notice identifies the driver and stops duplicate button after reload',async()=>{
 api.detail.mockResolvedValue({...detail,status:'en_route'});
 render(<PickupMobile/>);await screen.findByText('2010 Honda Civic');
 await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
 api.thirtyMinutes.mockResolvedValue({ok:true});
 api.detail.mockResolvedValue({...detail,status:'en_route',thirty_minutes_sent_at:'2026-09-13T12:00:00Z'});
 await userEvent.click(screen.getByRole('button',{name:"I'm 30 minutes away"}));
 expect(api.thirtyMinutes).toHaveBeenCalledWith('Test Driver');
 expect(await screen.findByRole('button',{name:'30-minute notice sent'})).toHaveProperty('disabled',true);
});
test('private ID upload records driver and photo kind on the assigned pickup',async()=>{
 render(<PickupMobile/>);await screen.findByText('2010 Honda Civic');
 await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
 const file=new File(['test-only-image'],'id.png',{type:'image/png'});
 api.upload.mockResolvedValue({ok:true});
 await userEvent.upload(screen.getByLabelText('Upload Seller ID · private'),file);
 expect(api.upload).toHaveBeenCalledWith('Test Driver','id_document',file);
 expect(await screen.findByText('Seller ID · private photo saved.')).toBeTruthy();
});
