import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import StatusPage from '@/app/(site)/status/[offer_id]/page';
import {STATUS_TOKEN_HEADER,readStatusToken,statusHref} from '@/lib/status-link';

// Made-up offer and token. The backend (WP0-260 / TRADE-191) answers only with the token in the header.
vi.mock('next/navigation',()=>({useParams:()=>({offer_id:'501'})}));
const TOKEN='t'.repeat(40)+'SELLERTOKEN0001';
const fetchMock=vi.fn();
vi.stubGlobal('fetch',fetchMock);
const go=(path:string)=>window.history.replaceState(null,'',path);
beforeEach(()=>{fetchMock.mockImplementation(async()=>Response.json({status:'scheduled',slot:'Tue 9-12',driver_name:'Driver Zed',eta_message:'Driver assigned'}));});
afterEach(()=>{cleanup();fetchMock.mockReset();go('/');});

it('sends the token from the link fragment in the header, never in the API URL',async()=>{
 go('/status/501#token='+TOKEN);
 render(<StatusPage/>);
 await screen.findByText('Driver: Driver Zed');
 const [url,init]=fetchMock.mock.calls[0];
 expect(String(url)).toMatch(/\/api\/public\/junkerz\/pickup\/501\/status$/);
 expect(String(url)).not.toContain(TOKEN);
 expect((init as RequestInit).headers).toEqual({[STATUS_TOKEN_HEADER]:TOKEN});
});

it('takes the token out of the address bar once read',async()=>{
 go('/status/501#token='+TOKEN);
 render(<StatusPage/>);
 await screen.findByText('Driver: Driver Zed');
 expect(window.location.href).not.toContain(TOKEN);
 expect(window.location.pathname).toBe('/status/501');
});

it('accepts an older ?token= page link but still sends it only in the header',async()=>{
 go('/status/501?token='+TOKEN);
 render(<StatusPage/>);
 await screen.findByText('Driver: Driver Zed');
 const [url,init]=fetchMock.mock.calls[0];
 expect(String(url)).not.toContain(TOKEN);
 expect((init as RequestInit).headers).toEqual({[STATUS_TOKEN_HEADER]:TOKEN});
 expect(window.location.href).not.toContain(TOKEN);
});

it('without a token it asks for the emailed link and calls nothing',async()=>{
 go('/status/501');
 render(<StatusPage/>);
 await screen.findByText(/Open this page from the link/);
 expect(fetchMock).not.toHaveBeenCalled();
});

it('a refused token (404) stops polling and asks for the emailed link',async()=>{
 fetchMock.mockImplementation(async()=>Response.json({error:'not_found'},{status:404}));
 go('/status/501#token='+TOKEN);
 render(<StatusPage/>);
 await screen.findByText(/Open this page from the link/);
 await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(1));
});

it('never shows an address even if one came back',async()=>{
 fetchMock.mockImplementation(async()=>Response.json({status:'scheduled',slot:'Tue 9-12',driver_name:null,address:'123 Made Up Lane'}));
 go('/status/501#token='+TOKEN);
 render(<StatusPage/>);
 await screen.findByText('Waiting for pickup partner confirmation');
 expect(document.body.textContent).not.toContain('123 Made Up Lane');
});

it('link helpers: fragment only, short tokens refused',()=>{
 expect(statusHref(501,TOKEN)).toBe('/status/501#token='+TOKEN);
 expect(statusHref(501,TOKEN)).not.toContain('?');
 expect(readStatusToken(new URLSearchParams(''),'#token='+TOKEN)).toBe(TOKEN);
 expect(readStatusToken(new URLSearchParams('token='+TOKEN),'')).toBe(TOKEN);
 expect(readStatusToken(new URLSearchParams('token=short'),'')).toBeNull();
 expect(readStatusToken(null,'')).toBeNull();
});
