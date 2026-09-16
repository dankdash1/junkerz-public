import React from 'react';
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {ShopCartProvider} from '@/components/ShopCart';
import ShopPage from '@/app/shop/page';
import CarPartsShop from '@/components/CarPartsShop';
const flags=vi.hoisted(()=>({enabled:true}));
const settings={sections:{parts:'live',cars_for_parts:'live',cars_for_sale:'live'} as const,parts_fulfillment:'delivery_only' as const,checkout_enabled:false as const};
const product={key:'part:9',id:9,carId:8,href:'/parts-inventory/9',name:'Alternator',kind:'part' as const,section:'parts' as const,priceCents:12500,image:null,detail:'Good',maxQuantity:1};
vi.mock('@/components/PageShell',()=>({SiteHeader:({showCart=true}:{showCart?:boolean})=><nav>{showCart&&<a href="/cart">Cart</a>}</nav>}));
vi.mock('@/lib/yard-requests',async importOriginal=>({...await importOriginal<object>(),getYardRequestSettings:async()=>({enabled:flags.enabled})}));
vi.mock('@/lib/shop-catalog',async importOriginal=>({...await importOriginal<object>(),getCatalogSettings:async()=>settings,loadShopPageCatalog:async()=>({notFound:false,products:[product]})}));
afterEach(()=>{cleanup();sessionStorage.clear();flags.enabled=true;});
it('enabled request intake explains quotes and removes cart controls from the shop',async()=>{
 render(<ShopCartProvider>{await ShopPage({searchParams:{}})}</ShopCartProvider>);
 expect(screen.queryByText(/Add to cart · Secure checkout/)).toBeNull();
 expect(screen.queryByRole('button',{name:'Add to cart'})).toBeNull();
 expect(screen.queryByRole('link',{name:'Cart'})).toBeNull();
 expect(screen.getByRole('button',{name:'Request this part'})).toBeTruthy();
 expect(screen.getByText(/Request availability · Review your quote/)).toBeTruthy();
 expect(screen.getByRole('link',{name:'View details'}).getAttribute('href')).toBe('/parts-inventory/9');
});
it('disabled request intake shows a real cart with no sandbox wording anywhere',async()=>{
 flags.enabled=false;const {container}=render(<ShopCartProvider>{await ShopPage({searchParams:{}})}</ShopCartProvider>);
 expect(screen.getByText(/Add to cart · Secure checkout/)).toBeTruthy();
 expect(screen.getByRole('button',{name:'Add to cart'})).toBeTruthy();
 expect(screen.queryByRole('button',{name:'Request this part'})).toBeNull();
 expect(container.textContent).not.toMatch(/sandbox|preview|test listing/i);
});
it('a donor without a canonical detail link retains its stock-specific request action',()=>{
 render(<ShopCartProvider><CarPartsShop products={[{...product,key:'parts-car:8',id:8,kind:'parts-car',section:'cars_for_parts',href:null,name:'Donor car'}]} settings={settings} requestIntakeEnabled settingsUnavailable={false} unavailable={false}/></ShopCartProvider>);
 expect(screen.queryByRole('link',{name:'View details'})).toBeNull();
 expect(screen.getByRole('button',{name:'Request a part from this car'})).toBeTruthy();
});
