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
 expect(requests.map(r=>({path:new URL(r.url).pathname,body:r.init.body ? JSON.parse(r.init.body as string) : null,auth:(r.init.headers as Record<string,string>).Authorization}))).toEqual([
 {path:'/api/buyers/onboarding/payment-method',body:{setup_intent_id:'seti_verified'},auth:'Bearer test-buyer-token'},
 {path:'/api/buyers/pickup/42/start',body:{eta_minutes:45},auth:'Bearer test-buyer-token'},
 {path:'/api/buyers/pickup/42/retry-payment',body:null,auth:'Bearer test-buyer-token'},
 ]);
});
