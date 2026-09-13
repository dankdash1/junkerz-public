import { afterEach, expect, test, vi } from 'vitest';
import { createPickupAccessApi } from '@/lib/pickup-access-api';
afterEach(()=>vi.unstubAllGlobals());
test('pickup credentials stay in Authorization and are never put in URL or body',async()=>{
 const calls:Array<{url:string;init:RequestInit}>=[];
 vi.stubGlobal('fetch',async(url:string,init:RequestInit)=>{calls.push({url,init});return new Response(JSON.stringify({ok:true}),{status:200});});
 const api=createPickupAccessApi('private-capability');
 await api.detail();await api.start('Test Driver',45);await api.thirtyMinutes('Test Driver');await api.complete('Test Driver');
 expect(calls.map(c=>new URL(c.url).pathname)).toEqual(['/api/pickup-access/detail','/api/pickup-access/start','/api/pickup-access/thirty-minutes','/api/pickup-access/complete']);
 for(const call of calls){
  expect(call.url).not.toContain('private-capability');
  expect(call.init.body || '').not.toContain('private-capability');
  expect((call.init.headers as Record<string,string>).Authorization).toBe('Bearer private-capability');
  expect(call.init.referrerPolicy).toBe('no-referrer');
 }
 expect(JSON.parse(calls[1].init.body as string)).toEqual({driver_name:'Test Driver',eta_minutes:45});
});
test('private photo uses authenticated fetch with no caching',async()=>{
 let request:RequestInit|undefined;
 vi.stubGlobal('fetch',async(_url:string,init:RequestInit)=>{request=init;return new Response('image',{status:200,headers:{'Content-Type':'image/jpeg'}});});
 const blob=await createPickupAccessApi('private-capability').photo(7);
 expect(blob.type).toBe('image/jpeg');
 expect(request?.cache).toBe('no-store');
 expect((request?.headers as Record<string,string>).Authorization).toBe('Bearer private-capability');
});
