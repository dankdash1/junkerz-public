import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SellerSchedulePage from '@/app/schedule/[token]/page';
vi.mock('next/navigation',()=>({useParams:()=>({token:'tok-123'}),useSearchParams:()=>new URLSearchParams(),useRouter:()=>({push:vi.fn(),replace:vi.fn()})}));
const offer={id:1,vin:null,year:2009,make:'Ford',model:'Focus',condition:'used',offer_cents:33000,contact_name:'Test Seller',contact_email:'seller@example.com',contact_phone:null,zip_code:'76107',pickup_address:'1 Main St, Fort Worth, TX 76107',seller_schedule_token_expires_at:null};
const fetchMock=vi.fn();
vi.stubGlobal('fetch',fetchMock);
beforeEach(()=>{
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
 await userEvent.selectOptions(screen.getByLabelText('Time window (Central)'),'1pm-3pm');
 expect(Array.from((screen.getByLabelText('Time window (Central)') as HTMLSelectElement).options).map(o=>o.value)).toEqual(['7am-9am','9am-11am','11am-1pm','1pm-3pm','3pm-5pm','5pm-7pm','7pm-9pm']);
 await userEvent.click(screen.getByRole('button',{name:'Schedule this slot'}));
 await screen.findByText('Pickup scheduled');
 const {url,body}=posted();
 expect(url).toBe('https://api.dankdash.ai/api/public/junkerz/seller/schedule/tok-123');
 expect(body.window).toBe('1pm-3pm');
 expect(body.pickup_date).toBe('2026-09-16');
 expect(body.slot).toMatch(/Sep 16 — 1pm-3pm$/);
 expect(typeof body.eta_at).toBe('string');
 expect(body.pickup_address).toBe('1 Main St, Fort Worth, TX 76107');
 expect(screen.getByText('Pickup window: 1pm-3pm CT')).toBeTruthy();
 expect(screen.getByText(/Driver arrives around Wed, Sep 16, 1:00 PM CT/)).toBeTruthy();
});
it('a quick pick names the window the backend uses and an immediate pickup names none',async()=>{
 render(<SellerSchedulePage/>);
 await userEvent.click(await screen.findByRole('button',{name:/Tomorrow morning/}));
 await screen.findByText('Pickup scheduled');
 expect(posted().body).toMatchObject({quick_pick:'tomorrow_am',slot:'Tomorrow morning',window:'9am-11am'});
 expect(screen.getByText('Pickup window: 9am-11am CT')).toBeTruthy();
 cleanup();fetchMock.mockClear();
 render(<SellerSchedulePage/>);
 await userEvent.click(await screen.findByRole('button',{name:/As soon as possible/}));
 await screen.findByText('Pickup scheduled');
 const {body}=posted();
 expect(body.quick_pick).toBe('immediately');
 expect('window' in body).toBe(false);
 await waitFor(()=>expect(screen.getByText(/1:00 PM CT/)).toBeTruthy());
});
