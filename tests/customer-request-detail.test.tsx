import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import Detail from '@/app/account/requests/[id]/page';
vi.mock('@/components/YardRequestQuote',()=>({default:()=> <section>Approved quote details</section>}));
vi.mock('@/components/YardRequestConversation',()=>({default:()=> <label>Message to Junkerz<textarea/></label>}));
afterEach(()=>{cleanup();vi.unstubAllGlobals()});
const request={id:'request1',reference:'JR-123',component:'Alternator',customer_message:'Your quote is approved',payment_available:true,payment_status:'unpaid'};
function mockPaymentFailure(status:number){
 const fetcher=vi.fn(async(url:string)=>new Response(JSON.stringify(url.endsWith('/payment-session')?{error:status===409?'Staff must verify stock ownership before payment.':'Your session expired'}:request),{status:url.endsWith('/payment-session')?status:200}));
 vi.stubGlobal('fetch',fetcher);return fetcher;
}
it('a payment conflict preserves the request, quote and message draft with an inline actionable error',async()=>{
 const fetcher=mockPaymentFailure(409);render(<Detail params={{id:'request1'}}/>);
 const payment=await screen.findByRole('button',{name:'Pay approved order'});
 fireEvent.change(screen.getByLabelText('Message to Junkerz'),{target:{value:'Please confirm stock'}});
 fireEvent.click(payment);
 expect(await screen.findByRole('alert')).toHaveProperty('textContent','Staff must verify stock ownership before payment.');
 expect(screen.getByRole('heading',{name:'Request JR-123'})).toBeTruthy();expect(screen.getByText('Approved quote details')).toBeTruthy();
 expect((screen.getByLabelText('Message to Junkerz') as HTMLTextAreaElement).value).toBe('Please confirm stock');
 expect(screen.queryByRole('link',{name:'Sign in to My Junkerz'})).toBeNull();
 expect(screen.getByRole('button',{name:'Pay approved order'}).hasAttribute('disabled')).toBe(false);
 fireEvent.click(screen.getByRole('button',{name:'Pay approved order'}));
 await waitFor(()=>expect(fetcher.mock.calls.filter(call=>call[0].endsWith('/payment-session'))).toHaveLength(2));
});
it('an authentication failure offers sign-in while preserving the loaded request',async()=>{
 mockPaymentFailure(401);render(<Detail params={{id:'request1'}}/>);
 fireEvent.click(await screen.findByRole('button',{name:'Pay approved order'}));
 expect(await screen.findByRole('link',{name:'Sign in to My Junkerz'})).toBeTruthy();
 expect(screen.getByRole('heading',{name:'Request JR-123'})).toBeTruthy();
});
it('a non-authentication load failure offers retry without suggesting sign-in',async()=>{
 vi.stubGlobal('fetch',vi.fn(async()=>new Response(JSON.stringify({error:'Temporarily unavailable'}),{status:503})));
 render(<Detail params={{id:'request1'}}/>);
 expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('Temporarily unavailable'));
 expect(screen.getByRole('button',{name:'Try again'})).toBeTruthy();expect(screen.queryByRole('link',{name:'Sign in to My Junkerz'})).toBeNull();
});
