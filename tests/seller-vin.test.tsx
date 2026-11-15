import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import VinUpdatePage from '@/app/vin/[token]/page';

vi.mock('next/navigation',()=>({useParams:()=>({token:'restricted-vin-token'})}));
const fetchMock=vi.fn();
const offer={id:42,year:2009,make:'Ford',model:'Focus',vin:null,last_owner_name:'Owner Name',last_owner_address:'1 Main St',title_state:'TX'};
beforeEach(()=>{vi.stubGlobal('fetch',fetchMock);fetchMock.mockImplementation(async(_url:string,init?:RequestInit)=>Response.json(init?.method==='POST'?{ok:true}:{offer}));});
afterEach(()=>{cleanup();fetchMock.mockReset();vi.unstubAllGlobals();});

it('uses the restricted VIN endpoint to load and save existing title details without scheduling',async()=>{
 render(<VinUpdatePage/>);
 const vin=await screen.findByLabelText('VIN (17 characters)');
 expect(screen.getByLabelText('Name on the title')).toHaveProperty('value','Owner Name');
 expect(screen.getByLabelText('Address on the title')).toHaveProperty('value','1 Main St');
 expect(screen.getByLabelText('State the title was issued in')).toHaveProperty('value','TX');
 fireEvent.change(vin,{target:{value:'1fahp35n09w123456'}});
 fireEvent.click(screen.getByRole('button',{name:'Save'}));
 await screen.findByText('Got it — thanks');
 expect(fetchMock.mock.calls.map(([url])=>url)).toEqual(['/api/public/junkerz/seller/vin-update/restricted-vin-token','/api/public/junkerz/seller/vin-update/restricted-vin-token']);
 expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({vin:'1FAHP35N09W123456',last_owner_name:'Owner Name',last_owner_address:'1 Main St',title_state:'TX'});
});

it('a finalized sale closes editing instead of presenting a schedule or VIN form',async()=>{
 fetchMock.mockResolvedValue(Response.json({error:'sale_finalized'},{status:409}));
 render(<VinUpdatePage/>);
 await screen.findByText(/already finalized/);
 expect(screen.queryByRole('button',{name:'Save'})).toBeNull();
 expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('keeps details available for correction when VIN validation fails',async()=>{
 fetchMock.mockImplementation(async(_url:string,init?:RequestInit)=>init?.method==='POST'?Response.json({error:'bad_vin'},{status:400}):Response.json({offer}));
 render(<VinUpdatePage/>);
 fireEvent.change(await screen.findByLabelText('VIN (17 characters)'),{target:{value:'INVALID'}});
 fireEvent.click(screen.getByRole('button',{name:'Save'}));
 await screen.findByText(/Check the VIN/);
 expect(screen.getByLabelText('VIN (17 characters)')).toHaveProperty('value','INVALID');
 expect(screen.queryByText('Got it — thanks')).toBeNull();
});
