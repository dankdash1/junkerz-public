import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import Success from '@/app/cart/success/page';
vi.mock('@/components/PageShell',()=>({SiteHeader:()=><nav/>}));
vi.mock('@/components/ShopCart',()=>({ClearPaidCart:()=><span data-testid="cart-cleared"/>}));
const fetchMock=vi.fn();
vi.stubGlobal('fetch',fetchMock);
afterEach(()=>{cleanup();fetchMock.mockReset();});
const SESSION='cs_test_a1B2c3D4e5F6';
it('a paid session, confirmed by the backend, shows the order and clears the cart',async()=>{
 fetchMock.mockResolvedValue(Response.json({status:'paid',order_id:91,order_number:'JZ-1091',total_cents:251200}));
 const {container}=render(await Success({searchParams:{session_id:SESSION}}));
 expect(fetchMock).toHaveBeenCalledOnce();
 expect(fetchMock.mock.calls[0][0]).toBe(`https://api.dankdash.ai/api/junkyard-public/cart/session/${SESSION}`);
 expect(screen.getByRole('heading',{name:'Payment received'})).toBeTruthy();
 expect(screen.getByText('JZ-1091')).toBeTruthy();
 expect(screen.getByText('$2,512.00')).toBeTruthy();
 expect(screen.getByTestId('cart-cleared')).toBeTruthy();
 expect(container.textContent).not.toMatch(/sandbox|simulated|test payment/i);
});
it('a pending session keeps the cart and asks the buyer to wait',async()=>{
 fetchMock.mockResolvedValue(Response.json({status:'pending',order_id:91,total_cents:251200}));
 render(await Success({searchParams:{session_id:SESSION}}));
 expect(screen.getByRole('heading',{name:'Payment is still processing'})).toBeTruthy();
 expect(screen.queryByTestId('cart-cleared')).toBeNull();
 expect(screen.getByRole('link',{name:/Back to your cart/})).toBeTruthy();
});
it('an expired session says no money was taken',async()=>{
 fetchMock.mockResolvedValue(Response.json({status:'expired',order_id:91,total_cents:251200}));
 render(await Success({searchParams:{session_id:SESSION}}));
 expect(screen.getByRole('heading',{name:'Checkout expired'})).toBeTruthy();
 expect(screen.getByText(/No money was taken/)).toBeTruthy();
 expect(screen.queryByTestId('cart-cleared')).toBeNull();
});
it('the browser is never trusted: a bad id makes no request and a backend error confirms nothing',async()=>{
 render(await Success({searchParams:{session_id:'paid=true'}}));
 expect(fetchMock).not.toHaveBeenCalled();
 expect(screen.getByRole('heading',{name:'Payment could not be confirmed'})).toBeTruthy();
 cleanup();
 fetchMock.mockResolvedValue(Response.json({error:'not_found'},{status:404}));
 render(await Success({searchParams:{session_id:SESSION}}));
 expect(screen.getByRole('heading',{name:'Payment could not be confirmed'})).toBeTruthy();
 expect(screen.queryByTestId('cart-cleared')).toBeNull();
});
