import { afterEach, expect, test, vi } from 'vitest';
import { buyerApi } from '@/lib/buyer-api';
afterEach(() => { vi.unstubAllGlobals(); });
test('payment and departure requests carry buyer auth and only tokenized payment data',async()=>{
 vi.stubGlobal('localStorage', {getItem: (key: string) => key === 'buyer_token' ? 'test-buyer-token' : null});
 const requests: Array<{url:string;init:RequestInit}> = [];
 vi.stubGlobal('fetch',async(url:string,init:RequestInit)=>{requests.push({url,init}); return new Response(JSON.stringify({ok:true}),{status:200});});
 await buyerApi.savePaymentMethod('seti_verified');
 await buyerApi.startPickup(42,45);
 await buyerApi.retryPickupPayment(42);
 expect(requests.map(r=>({path:new URL(r.url, "https://junkerz.com").pathname,body:r.init.body ? JSON.parse(r.init.body as string) : null,auth:(r.init.headers as Record<string,string>).Authorization}))).toEqual([
 {path:'/api/buyers/onboarding/payment-method',body:{setup_intent_id:'seti_verified'},auth:'Bearer test-buyer-token'},
 {path:'/api/buyers/pickup/42/start',body:{eta_minutes:45},auth:'Bearer test-buyer-token'},
 {path:'/api/buyers/pickup/42/retry-payment',body:null,auth:'Bearer test-buyer-token'},
 ]);
});
test('signature carries reviewed revision with buyer authentication',async()=>{
 vi.stubGlobal('localStorage',{getItem:()=> 'buyer-auth'});
 const fetcher=vi.fn().mockResolvedValue(new Response(JSON.stringify({ok:true}),{status:200}));
 vi.stubGlobal('fetch',fetcher);
 const body={signer_role:'seller' as const,signer_name:'Seller',signature:'ink',document_revision:'revision-1'};
 await buyerApi.pickupSignature(42,body);
 const [url,request]=fetcher.mock.calls[0];
 expect(new URL(url,'https://junkerz.com').pathname).toBe('/api/buyers/pickup/42/signature');
 expect(request.headers.Authorization).toBe('Bearer buyer-auth');
 expect(JSON.parse(request.body)).toEqual(body);
});
