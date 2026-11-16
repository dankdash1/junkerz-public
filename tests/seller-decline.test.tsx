import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import DeclinePage from '@/app/(site)/decline/[token]/page';
const api=vi.hoisted(()=>({getOfferForToken:vi.fn(),declineOffer:vi.fn()}));
vi.mock('@/lib/api',()=>api);
vi.mock('next/navigation',()=>({useParams:()=>({token:'offer-token'})}));
beforeEach(()=>{api.getOfferForToken.mockResolvedValue({offer:{id:42,year:2009,make:'Ford',model:'Focus',offer_cents:33000}});api.declineOffer.mockResolvedValue({ok:true,wants_callback:false});});
afterEach(()=>{cleanup();vi.clearAllMocks();});

it('allows a price decline without desired price, competitor, or callback',async()=>{
 render(<DeclinePage/>);
 await screen.findByText('2009 Ford Focus');
 fireEvent.click(screen.getByRole('button',{name:/The price is too low/}));
 fireEvent.click(screen.getByRole('button',{name:'Send'}));
 await waitFor(()=>expect(api.declineOffer).toHaveBeenCalledWith('offer-token',expect.objectContaining({reason:'price',desired_cents:undefined,competitor_cents:undefined,wants_callback:false})));
 await screen.findByRole('heading',{name:'Thanks for telling us'});
 expect(screen.queryByText('New offer')).toBeNull();
});

it('saves explicitly requested callback and optional prices, showing a counter only when supplied',async()=>{
 api.declineOffer.mockResolvedValue({ok:true,wants_callback:true,counter_cents:50000});
 render(<DeclinePage/>);
 await screen.findByText('2009 Ford Focus');
 fireEvent.click(screen.getByRole('button',{name:/The price is too low/}));
 fireEvent.change(screen.getByLabelText('What would you take? (optional)'),{target:{value:'600'}});
 fireEvent.change(screen.getByLabelText('Better offer from'),{target:{value:'Other buyer'}});
 fireEvent.change(screen.getByLabelText('How much?'),{target:{value:'550'}});
 fireEvent.click(screen.getByRole('checkbox',{name:/Call me/}));
 fireEvent.click(screen.getByRole('button',{name:'Send it and call me'}));
 await screen.findByText('New offer');
 expect(api.declineOffer).toHaveBeenCalledWith('offer-token',expect.objectContaining({desired_cents:60000,competitor_name:'Other buyer',competitor_cents:55000,wants_callback:true}));
 expect(screen.getByRole('link',{name:/Accept & pick a pickup time/})).toHaveProperty('href',expect.stringContaining('/schedule/offer-token'));
});
