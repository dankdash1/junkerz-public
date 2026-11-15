import React from 'react';
import { afterEach,beforeEach,expect,test,vi } from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PickupMobile from '@/components/junkerz/PickupMobile';
import {sellerAgreement} from './fixtures/seller-agreement';
const api=vi.hoisted(()=>({detail:vi.fn(),start:vi.fn(),arrive:vi.fn(),thirtyMinutes:vi.fn(),complete:vi.fn(),signature:vi.fn(),upload:vi.fn(),photo:vi.fn()}));
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
 api.detail.mockResolvedValue({...detail,status:'arrived',seller_signature:{signer_name:'Test Seller',signed_at:'2026-09-13T12:00:00Z'}});
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

test('opening and reopening a completed link never writes pickup state',async()=>{
 api.detail.mockResolvedValue({...detail,status:'completed',completed_at:'2026-09-13T22:00:00Z'});
 const view=render(<PickupMobile/>);
 expect(await screen.findByText('Already completed')).toBeTruthy();
 expect(screen.getByText(/Recorded completion:/)).toBeTruthy();
 view.unmount();render(<PickupMobile/>);await screen.findByText('Already completed');
 for(const action of [api.start,api.arrive,api.complete,api.signature,api.upload,api.thirtyMinutes]) expect(action).not.toHaveBeenCalled();
 expect(screen.queryByRole('button',{name:'Pickup complete'})).toBeNull();
});
test('driver explicitly arrives before completing and cannot restart departure',async()=>{
 api.detail.mockResolvedValue({...detail,status:'en_route',seller_signature:{signer_name:'Seller',signed_at:'2026-09-13T12:00:00Z'}});
 render(<PickupMobile/>);await screen.findByText('2010 Honda Civic');
 expect(api.complete).not.toHaveBeenCalled();expect(api.arrive).not.toHaveBeenCalled();
 await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
 await userEvent.click(screen.getByLabelText('The vehicle has been collected.'));
 expect(screen.getByRole('button',{name:'Pickup complete'})).toHaveProperty('disabled',true);
 api.arrive.mockResolvedValue({ok:true});
 api.detail.mockResolvedValue({...detail,status:'arrived',seller_signature:{signer_name:'Seller',signed_at:'2026-09-13T12:00:00Z'}});
 await userEvent.click(screen.getByRole('button',{name:"I've arrived"}));
 expect(api.arrive).toHaveBeenCalledWith('Test Driver');
 expect(await screen.findByText('Arrival recorded')).toBeTruthy();
 expect(screen.queryByRole('button',{name:"I'm on my way"})).toBeNull();
 expect(screen.queryByRole('button',{name:"I'm 30 minutes away"})).toBeNull();
 expect(api.complete).not.toHaveBeenCalled();
});

test('seller reviews actual agreement and submits its revision without completing collection',async()=>{
 api.detail.mockResolvedValue({...detail,agreement:sellerAgreement});
 render(<PickupMobile/>);await screen.findByRole('region',{name:'Bill of Sale agreement'});
 expect(screen.getByText(sellerAgreement.buyer_address)).toBeTruthy();
 expect(screen.getByText(sellerAgreement.agreement_text)).toBeTruthy();
 expect(screen.getByText(`Condition: ${sellerAgreement.condition}`)).toBeTruthy();
 expect(screen.getByText(`License plate: ${sellerAgreement.license_plate} (${sellerAgreement.license_plate_state})`)).toBeTruthy();
 await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
 await userEvent.type(screen.getByLabelText('Seller’s email for their signed copy'),'seller@example.test');
 await userEvent.click(screen.getByRole('button',{name:'Test seller draws signature'}));
 api.signature.mockResolvedValue({ok:true});
 api.detail.mockResolvedValue({...detail,seller_signature:{signer_name:'Test Seller',signed_at:'2026-09-13T12:00:00Z'},agreement:{...sellerAgreement,agreement_text:'Changed current terms'}});
 await userEvent.click(screen.getByRole('button',{name:'Save seller signature'}));
 await waitFor(()=>expect(api.signature).toHaveBeenCalledWith('Test Driver','Test Seller','data:image/png;base64,test','preview-revision-1','seller@example.test'));
 await waitFor(()=>expect(screen.queryByRole('region',{name:'Bill of Sale agreement'})).toBeNull());
 expect(screen.queryByText('Changed current terms')).toBeNull();
 expect(api.complete).not.toHaveBeenCalled();
});

test.each(['buyer_address','seller_address','vin','document_revision','agreement_text'] as const)('missing %s blocks onsite signature',async field=>{
 api.detail.mockResolvedValue({...detail,agreement:{...sellerAgreement,[field]:''}});
 render(<PickupMobile/>);await screen.findByRole('region',{name:'Bill of Sale agreement'});
 await userEvent.type(screen.getByLabelText('Your name'),'Driver');
 await userEvent.click(screen.getByRole('button',{name:'Test seller draws signature'}));
 expect(screen.getByRole('button',{name:'Save seller signature'})).toHaveProperty('disabled',true);
 expect(api.signature).not.toHaveBeenCalled();
});

test('changed agreement requires reload before another signature attempt',async()=>{
 api.detail.mockResolvedValue({...detail,agreement:sellerAgreement});
 api.signature.mockRejectedValue(new Error('document_changed'));
 render(<PickupMobile/>);await screen.findByRole('region',{name:'Bill of Sale agreement'});
 await userEvent.type(screen.getByLabelText('Your name'),'Driver');
 await userEvent.click(screen.getByRole('button',{name:'Test seller draws signature'}));
 await userEvent.click(screen.getByRole('button',{name:'Save seller signature'}));
 expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Reload'));
 expect(screen.getByRole('button',{name:'Save seller signature'})).toHaveProperty('disabled',true);
 expect(api.signature).toHaveBeenCalledTimes(1);
 expect(api.complete).not.toHaveBeenCalled();
});
test('seller signed online first: driver still records departure then arrival',async()=>{
 const signed={...detail,status:'signed',seller_signature:{signer_name:'Seller',signed_at:'2026-09-13T12:00:00Z'},departed_at:null,arrived_at:null};
 api.detail.mockResolvedValue(signed);
 render(<PickupMobile/>);await screen.findByText('2010 Honda Civic');
 expect(screen.queryByText('Arrival recorded')).toBeNull();
 expect(screen.getByRole('button',{name:"I've arrived"})).toHaveProperty('disabled',true);
 await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
 api.start.mockResolvedValue({ok:true,status:'signed'});
 api.detail.mockResolvedValue({...signed,departed_at:'2026-09-13T12:05:00Z'});
 await userEvent.click(screen.getByRole('button',{name:"I'm on my way"}));
 expect(await screen.findByText('Departure recorded')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Pickup complete'})).toHaveProperty('disabled',true);
 api.arrive.mockResolvedValue({ok:true,status:'signed'});
 api.detail.mockResolvedValue({...signed,departed_at:'2026-09-13T12:05:00Z',arrived_at:'2026-09-13T12:30:00Z'});
 await userEvent.click(screen.getByRole('button',{name:"I've arrived"}));
 await waitFor(()=>expect(api.arrive).toHaveBeenCalledWith('Test Driver'));
 expect(await screen.findByText('Arrival recorded')).toBeTruthy();
});
test('older backend without travel fields keeps signed pickups treated as arrived',async()=>{
 api.detail.mockResolvedValue({...detail,status:'signed',seller_signature:{signer_name:'Seller',signed_at:'2026-09-13T12:00:00Z'}});
 render(<PickupMobile/>);await screen.findByText('2010 Honda Civic');
 expect(screen.getByText('Arrival recorded')).toBeTruthy();
});
