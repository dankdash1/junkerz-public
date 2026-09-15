import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PickupPage from '@/app/pickup/[offer_id]/page';
import {readAcceptOtp} from '@/lib/pickup-accept';
const nav=vi.hoisted(()=>({search:new URLSearchParams(),push:vi.fn()}));
vi.mock('next/navigation',()=>({useParams:()=>({offer_id:'42'}),useSearchParams:()=>nav.search,useRouter:()=>({push:nav.push,replace:vi.fn()})}));
const fetchMock=vi.fn();
vi.stubGlobal('fetch',fetchMock);
beforeEach(()=>{nav.search=new URLSearchParams();nav.push.mockReset();window.history.replaceState({},'','/pickup/42');fetchMock.mockResolvedValue(Response.json({ok:true}));});
afterEach(()=>{cleanup();fetchMock.mockReset();});
async function fillForm(){
 await userEvent.click(await screen.findByRole('button',{name:'Tomorrow 1PM-3PM'}));
 fireEvent.change(screen.getAllByRole('textbox')[0],{target:{value:'1 Main St, Fort Worth, TX'}});
 fireEvent.change(screen.getAllByRole('textbox')[1],{target:{value:'8175550100'}});
}
it('the one-time code is read from the query string first, then the fragment, and junk is ignored',()=>{
 expect(readAcceptOtp('?otp=abc123XYZ')).toBe('abc123XYZ');
 expect(readAcceptOtp(new URLSearchParams(''),'#otp=frag-token_9')).toBe('frag-token_9');
 expect(readAcceptOtp('?otp=query1','#otp=frag2')).toBe('query1');
 expect(readAcceptOtp('?otp=<script>','#')).toBe(null);
 expect(readAcceptOtp('','')).toBe(null);
 expect(readAcceptOtp(null,undefined)).toBe(null);
});
it('the emailed link ?otp= is sent in the accept body and the seller moves on to status',async()=>{
 nav.search=new URLSearchParams('otp=tok_ABC123');
 render(<PickupPage/>);
 expect(screen.queryByText(/Open the link from your email/)).toBeNull();
 await fillForm();
 await userEvent.click(screen.getByRole('button',{name:'Confirm pickup'}));
 await waitFor(()=>expect(nav.push).toHaveBeenCalledWith('/status/42'));
 const [acceptUrl,acceptInit]=fetchMock.mock.calls[0];
 expect(acceptUrl).toBe('https://api.dankdash.ai/api/public/junkerz/offer/42/accept');
 expect(acceptInit.method).toBe('POST');
 expect(JSON.parse(acceptInit.body)).toEqual({otp:'tok_ABC123'});
 expect(fetchMock.mock.calls[1][0]).toBe('https://api.dankdash.ai/api/public/junkerz/pickup/42/schedule');
});
it('a code carried in the #otp= fragment works too',async()=>{
 window.history.replaceState({},'','/pickup/42#otp=frag_token');
 render(<PickupPage/>);
 await waitFor(()=>expect(screen.queryByText(/Open the link from your email/)).toBeNull());
 await fillForm();
 await userEvent.click(screen.getByRole('button',{name:'Confirm pickup'}));
 await waitFor(()=>expect(fetchMock).toHaveBeenCalled());
 expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({otp:'frag_token'});
});
it('without a code the page says to open the email link and never posts a silent 401',async()=>{
 render(<PickupPage/>);
 expect((await screen.findByRole('alert')).textContent).toMatch(/Open the link from your email to accept/);
 await fillForm();
 expect(screen.getByRole('button',{name:'Confirm pickup'})).toHaveProperty('disabled',true);
 expect(fetchMock).not.toHaveBeenCalled();
});
it('a rejected or expired code is explained, and the pickup is not scheduled',async()=>{
 nav.search=new URLSearchParams('otp=stale');
 fetchMock.mockResolvedValue(Response.json({error:'otp_invalid_or_expired'},{status:401}));
 render(<PickupPage/>);
 await fillForm();
 await userEvent.click(screen.getByRole('button',{name:'Confirm pickup'}));
 expect((await screen.findByText(/expired or was already used/)).textContent).toMatch(/newest email/);
 expect(fetchMock).toHaveBeenCalledTimes(1);
 expect(nav.push).not.toHaveBeenCalled();
});
