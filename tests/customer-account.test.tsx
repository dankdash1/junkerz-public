import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Verify from '@/app/account/verify/page';
import { POST, GET } from '@/app/api/customer/[...path]/route';
import { NextRequest } from 'next/server';
afterEach(()=>{cleanup();vi.unstubAllGlobals();window.history.replaceState(null,'','/');});
it('GET link scanners do not consume a challenge; confirmation POST is explicit',async()=>{
  window.history.replaceState(null,'','/account/verify#challenge=opaque-test-challenge');
  const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true}),{status:200}));vi.stubGlobal('fetch',fetcher);
  render(<Verify/>);
  expect(fetcher).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Confirm sign-in'}));
  await waitFor(()=>expect(fetcher).toHaveBeenCalledTimes(1));
  expect(fetcher.mock.calls[0][1].method).toBe('POST');
  expect(screen.getByText('You are signed in.')).toBeTruthy();
});
it('proxy refuses unknown routes and cross-origin mutations before contacting backend',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 const denied=await POST(new NextRequest('https://www.junkerz.com/api/customer/logout',{method:'POST',headers:{origin:'https://evil.invalid'}}),{params:{path:['logout']}});
 expect(denied.status).toBe(403);
 const unknown=await GET(new NextRequest('https://www.junkerz.com/api/customer/admin'),{params:{path:['admin']}});
 expect(unknown.status).toBe(404);expect(fetcher).not.toHaveBeenCalled();
});
it('proxy stores session only in secure host-only HttpOnly cookie and strips client JSON',async()=>{
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({session:'s'.repeat(64),expires_in:604800}),{status:200}));vi.stubGlobal('fetch',fetcher);
 const result=await POST(new NextRequest('https://www.junkerz.com/api/customer/verify',{method:'POST',headers:{origin:'https://www.junkerz.com','content-type':'application/json'},body:JSON.stringify({challenge:'c'.repeat(44)})}),{params:{path:['verify']}});
 expect(await result.json()).toEqual({success:true});
 const cookie=result.headers.get('set-cookie')||'';expect(cookie).toContain('HttpOnly');expect(cookie).toContain('Secure');expect(cookie).toContain('SameSite=lax');expect(cookie).not.toContain('Domain=');
 expect(fetcher.mock.calls[0][0]).toBe('https://api.dankdash.ai/api/junkyard-public/customer/verify');
});
// The site is served on both junkerz.com and www.junkerz.com. A visitor who
// landed on the apex (what the ads and cards print) must be able to sign in
// and file a request, while everything else stays refused exactly as before.
const signIn=(headers:Record<string,string>,url='https://www.junkerz.com/api/customer/sign-in-link')=>
 POST(new NextRequest(url,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify({email:'seller@example.test'})}),{params:{path:['sign-in-link']}});
it('proxy accepts a mutation from both the apex and the www host',async()=>{
 // A fresh Response each call: a body can only be read once.
 const fetcher=vi.fn(async()=>new Response(JSON.stringify({accepted:true}),{status:202}));vi.stubGlobal('fetch',fetcher);
 const apex=await signIn({origin:'https://junkerz.com','sec-fetch-site':'same-origin'},'https://junkerz.com/api/customer/sign-in-link');
 expect(apex.status).toBe(202);expect(await apex.json()).toEqual({accepted:true});
 const www=await signIn({origin:'https://www.junkerz.com','sec-fetch-site':'same-origin'});
 expect(www.status).toBe(202);expect(await www.json()).toEqual({accepted:true});
 expect(fetcher).toHaveBeenCalledTimes(2);
 expect(fetcher.mock.calls.every(call=>call[0]==='https://api.dankdash.ai/api/junkyard-public/customer/sign-in-link')).toBe(true);
});
it('proxy still refuses a foreign origin, a missing origin and a cross-site mutation',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 const foreign=await signIn({origin:'https://evil.example'});
 expect(foreign.status).toBe(403);expect(await foreign.json()).toEqual({error:'Invalid request origin'});
 const missing=await signIn({});
 expect(missing.status).toBe(403);expect(await missing.json()).toEqual({error:'Invalid request origin'});
 for(const origin of ['https://junkerz.com','https://www.junkerz.com']) {
   const crossSite=await signIn({origin,'sec-fetch-site':'cross-site'});
   expect(crossSite.status).toBe(403);expect(await crossSite.json()).toEqual({error:'Invalid request origin'});
 }
 // A lookalike host must not pass — the check is exact membership, not a suffix.
 const lookalike=await signIn({origin:'https://junkerz.com.evil.example'});
 expect(lookalike.status).toBe(403);
 expect(fetcher).not.toHaveBeenCalled();
});
it('proxy leaves reads alone: a GET needs no origin header at all',async()=>{
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({enabled:true}),{status:200}));vi.stubGlobal('fetch',fetcher);
 const read=await GET(new NextRequest('https://junkerz.com/api/customer/settings'),{params:{path:['settings']}});
 expect(read.status).toBe(200);expect(await read.json()).toEqual({enabled:true});
 expect(fetcher.mock.calls[0][0]).toBe('https://api.dankdash.ai/api/junkyard-public/customer/settings');
});

import YardRequestForm from '@/components/YardRequestForm';
it('first request waits for email verification and retains a durable draft instead of routing to the yard',async()=>{
 const fetcher=vi.fn(async(url:string)=>{
   if(url.endsWith('/settings'))return new Response(JSON.stringify({enabled:true}),{status:200});
   if(url.endsWith('/me'))return new Response(JSON.stringify({error:'Sign in to My Junkerz'}),{status:401});
   if(url.endsWith('/sign-in-link'))return new Response(JSON.stringify({accepted:true}),{status:202});
   throw new Error('Unexpected yard routing before verification');
 });vi.stubGlobal('fetch',fetcher);
 render(<YardRequestForm target={{kind:'part',partId:8,label:'Alternator'}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Request this part'}));
 fireEvent.change(screen.getByLabelText('Your name'),{target:{value:'Customer'}});
 fireEvent.change(screen.getByLabelText('Email'),{target:{value:'customer@example.invalid'}});
 fireEvent.click(screen.getByRole('button',{name:'Send request'}));
 expect(await screen.findByText('Verify your email to send this request')).toBeTruthy();
 const sent=fetcher.mock.calls.find(call=>call[0].endsWith('/sign-in-link')) as unknown as [string,RequestInit];
 expect(JSON.parse(sent[1].body as string).claim_context.request.part_id).toBe(8);
 expect(fetcher.mock.calls.some(call=>call[0].endsWith('/yard-requests'))).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Edit request'}));
 expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Customer');
 expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('customer@example.invalid');
});

it('proxy forwards only the retail cookie and clears it after expired authentication',async()=>{
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({error:'Sign in'}),{status:401}));vi.stubGlobal('fetch',fetcher);
 const result=await GET(new NextRequest('https://www.junkerz.com/api/customer/me',{headers:{cookie:'__Host-junkerz_customer=retail-session; buyer_token=buyer-secret',authorization:'Bearer forged-admin'}}),{params:{path:['me']}});
 expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer retail-session');
 expect(JSON.stringify(fetcher.mock.calls[0])).not.toContain('buyer-secret');
 expect(result.headers.get('set-cookie')).toContain('Max-Age=0');
});
it('proxy rejects verification by GET and mutations without Origin',async()=>{
 const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
 expect((await GET(new NextRequest('https://www.junkerz.com/api/customer/verify'),{params:{path:['verify']}})).status).toBe(404);
 expect((await POST(new NextRequest('https://www.junkerz.com/api/customer/logout',{method:'POST'}),{params:{path:['logout']}})).status).toBe(403);
 expect(fetcher).not.toHaveBeenCalled();
});
