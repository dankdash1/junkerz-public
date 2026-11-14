import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SellerSchedulePage from '@/app/schedule/[token]/page';
vi.mock('next/navigation',()=>({useParams:()=>({token:'tok-123'}),useSearchParams:()=>new URLSearchParams(),useRouter:()=>({push:vi.fn(),replace:vi.fn()})}));
const offer={id:1,vin:null,year:2009,make:'Ford',model:'Focus',condition:'used',offer_cents:33000,contact_name:'Test Seller',contact_email:'seller@example.com',contact_phone:null,zip_code:'76107',pickup_address:'1 Main St, Fort Worth, TX 76107',seller_schedule_token_expires_at:null};
// Flow fixtures set the pickup switch themselves (on by default; the pause test turns it off).
const pickupState=vi.hoisted(()=>({live:true}));
vi.mock('@/lib/site',async(importOriginal)=>({
 ...await importOriginal<typeof import('@/lib/site')>(),
 get PICKUPS_LIVE(){return pickupState.live;},
}));
const fetchMock=vi.fn();
vi.stubGlobal('fetch',fetchMock);
beforeEach(()=>{pickupState.live=true;
 Element.prototype.scrollIntoView=vi.fn();
 fetchMock.mockImplementation(async(url:string,init?:RequestInit)=>{
  if(init?.method==='POST'){
   const body=JSON.parse(String(init.body));
   // The backend derives the instant from pickup_date + window in Central and answers with it: 1pm CDT on Sep 16 is 18:00Z.
   return Response.json({ok:true,slot:body.slot,window:body.window,pickup_date:body.pickup_date,eta_at:'2026-09-16T18:00:00Z'});
  }
  return Response.json({offer,quick_picks:[{key:'tomorrow_am',label:'Tomorrow morning'},{key:'immediately',label:'As soon as possible'}]});
 });
});
afterEach(()=>{cleanup();fetchMock.mockReset();});
const posted=()=>{const call=fetchMock.mock.calls.find(([,init])=>init?.method==='POST');if(!call)throw new Error('no POST');return {url:call[0] as string,body:JSON.parse(String(call[1].body))};};
it('a custom pickup sends the chosen window label with pickup_date and eta_at, and confirms the hour in Central',async()=>{
 render(<SellerSchedulePage/>);
 await userEvent.click(await screen.findByRole('button',{name:/Pick a custom date/}));
 fireEvent.change(screen.getByLabelText('Date'),{target:{value:'2026-09-16'}});
 await userEvent.selectOptions(screen.getByLabelText('Time window (Central)'),'1pm-4pm');
 expect(Array.from((screen.getByLabelText('Time window (Central)') as HTMLSelectElement).options).map(o=>o.value)).toEqual(['7am-10am','10am-1pm','1pm-4pm','4pm-7pm']);
 await userEvent.click(screen.getByRole('button',{name:'Save pickup preference'}));
 await screen.findByText('Pickup preference saved');
 const {url,body}=posted();
 expect(url).toBe('/api/public/junkerz/seller/schedule/tok-123');
 expect(body.window).toBe('1pm-4pm');
 expect(body.pickup_date).toBe('2026-09-16');
 expect(body.slot).toMatch(/Sep 16 — 1pm-4pm$/);
 expect(typeof body.eta_at).toBe('string');
 expect(body.pickup_address).toBe('1 Main St, Fort Worth, TX 76107');
 expect(screen.getByText('Preferred window: 1pm-4pm CT')).toBeTruthy();
 expect(screen.getByText(/Requested: Wed, Sep 16, 1:00 PM CT/)).toBeTruthy();
});
it('a quick pick names the window the backend uses and an immediate pickup names none',async()=>{
 render(<SellerSchedulePage/>);
 await userEvent.click(await screen.findByRole('button',{name:/Tomorrow morning/}));
 await screen.findByText('Pickup preference saved');
 expect(posted().body).toMatchObject({quick_pick:'tomorrow_am',slot:'Tomorrow morning',window:'10am-1pm'});
 expect(screen.getByText('Preferred window: 10am-1pm CT')).toBeTruthy();
 cleanup();fetchMock.mockClear();
 render(<SellerSchedulePage/>);
 await userEvent.click(await screen.findByRole('button',{name:/As soon as possible/}));
 await screen.findByText('Pickup preference saved');
 const {body}=posted();
 expect(body.quick_pick).toBe('immediately');
 expect('window' in body).toBe(false);
 await waitFor(()=>expect(screen.getByText(/1:00 PM CT/)).toBeTruthy());
});

it('paused pickups show the opening notice without loading or submitting a pickup',async()=>{
 // Production pickups are on (George 11-11); this keeps the off switch working.
 pickupState.live=false;
 render(<SellerSchedulePage/>);
 expect(await screen.findByRole('heading',{name: /not picking up cars yet/i})).toBeTruthy();
 expect(screen.getByText(/we are not scheduling pickups yet/)).toBeTruthy();
 expect(screen.queryByRole('button',{name:/Save pickup preference|Tomorrow morning/})).toBeNull();
 expect(fetchMock).not.toHaveBeenCalled();
});

it('reopening an existing request shows its legacy window and address without scheduling again',async()=>{
 fetchMock.mockResolvedValue(Response.json({error:'already_scheduled',offer,slot:'Wed, Sep 16 — 9am-11am',eta_at:'2026-09-16T14:00:00Z'},{status:409}));
 render(<SellerSchedulePage/>);
 await screen.findByText('Pickup preference saved');
 expect(screen.getByText('Wed, Sep 16 — 9am-11am')).toBeTruthy();
 expect(screen.getByText(/Pickup address: 1 Main St/)).toBeTruthy();
 expect(screen.queryByRole('button',{name:/Save pickup preference|Tomorrow morning/})).toBeNull();
 expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('preserves a legacy window returned by the server instead of relabeling an old booking',async()=>{
 fetchMock.mockImplementation(async(_url:string,init?:RequestInit)=>init?.method==='POST'
  ? Response.json({ok:true,slot:'Tomorrow morning',window:'9am-11am',eta_at:'2026-09-16T14:00:00Z'})
  : Response.json({offer,quick_picks:[{key:'tomorrow_am',label:'Tomorrow morning'}]}));
 render(<SellerSchedulePage/>);
 await userEvent.click(await screen.findByRole('button',{name:/Tomorrow morning/}));
 expect(await screen.findByText('Preferred window: 9am-11am CT')).toBeTruthy();
});
