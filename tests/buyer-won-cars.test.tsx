import React from 'react';
import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WonCars from '@/app/buyers/won-cars/page';
vi.mock('@/lib/buyer-api',()=>({buyerApi:{wonCars:async()=>[{match_id:42,status:'won',bid_cents:70000,year:2010,make:'Honda',model:'Civic'}]}}));
test('won-car action leads to signature and pickup workflow instead of submitting collection',async()=>{
 render(<WonCars/>);
 const link=await screen.findByRole('link',{name:'Open pickup checklist'});
 expect(link.getAttribute('href')).toBe('/buyers/won-cars/42');
 expect(screen.queryByRole('button',{name:'Mark Picked Up'})).toBeNull();
});
