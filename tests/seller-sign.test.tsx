import React from 'react';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import SellerSignPage from '@/app/sign/[token]/page';

vi.mock('next/navigation',()=>({useParams:()=>({token:'sign-token'})}));
vi.mock('@/components/junkerz/SignaturePad',()=>({default:({onChange,disabled}:{onChange:(value:string|null)=>void;disabled:boolean})=>(
 <button type="button" disabled={disabled} onClick={()=>onChange('data:image/png;base64,signature')}>Draw signature</button>
)}));
const preview={pickup_order_id:42,document_revision:'revision-1',agreement_text:'Vehicle is sold AS-IS to the buyer named above.',buyer_name:'Actual Buyer',buyer_address:'11 Buyer St',buyer_phone:'2145550101',seller_name:'Seller Name',seller_address:'22 Seller St',seller_email:'seller@example.com',vehicle:{year:2009,make:'Ford',model:'Focus',vin:'1FAHP35N09W123456'},sale_price_cents:33000};
const fetchMock=vi.fn();
beforeEach(()=>{
 vi.stubGlobal('fetch',fetchMock);
 fetchMock.mockImplementation(async(_url:string,init?:RequestInit)=>init?.method==='POST'
  ? Response.json({ok:true,pickup_order_id:42,signature_id:7,receipt_email:{sent:false}})
  : Response.json(preview));
});
afterEach(()=>{cleanup();fetchMock.mockReset();vi.unstubAllGlobals();});
const posts=()=>fetchMock.mock.calls.filter(([,init])=>init?.method==='POST');

it('requires ink, shows real party details, and submits the exact preview revision',async()=>{
 render(<SellerSignPage/>);
 await screen.findByText('Actual Buyer');
 expect(screen.getByText('11 Buyer St',{exact:false})).toBeTruthy();
 expect(screen.getByText('22 Seller St',{exact:false})).toBeTruthy();
 expect(screen.getByLabelText('Name of person signing')).toHaveProperty('value','Seller Name');
 expect(screen.getByText(preview.agreement_text)).toBeTruthy();
 const submit=screen.getByRole('button',{name:'I confirm and sign'});
 expect(submit).toHaveProperty('disabled',true);
 fireEvent.click(screen.getByRole('button',{name:'Draw signature'}));
 fireEvent.click(submit);
 await screen.findByText('Your signed Bill of Sale is saved');
 expect(JSON.parse(posts()[0][1].body)).toEqual({signature_data_url:'data:image/png;base64,signature',signer_name:'Seller Name',seller_email:'seller@example.com',document_revision:'revision-1'});
 expect(screen.getByText(/Email delivery has not been confirmed/)).toBeTruthy();
 expect(screen.queryByText(/has been sent by email/)).toBeNull();
});

it.each(['buyer_address','seller_address','seller_name','document_revision','agreement_text'])('blocks signing when %s is missing',async(field)=>{
 fetchMock.mockResolvedValue(Response.json({...preview,[field]:null}));
 render(<SellerSignPage/>);
 await screen.findByText('Actual Buyer');
 expect(screen.getByRole('button',{name:'Draw signature'})).toHaveProperty('disabled',true);
 expect(screen.getByRole('button',{name:'I confirm and sign'})).toHaveProperty('disabled',true);
 expect(posts()).toHaveLength(0);
});

it('locks a changed document until the seller reloads and reviews it',async()=>{
 fetchMock.mockImplementation(async(_url:string,init?:RequestInit)=>init?.method==='POST'
  ? Response.json({error:'document_changed'},{status:409}) : Response.json(preview));
 render(<SellerSignPage/>);
 fireEvent.click(await screen.findByRole('button',{name:'Draw signature'}));
 fireEvent.click(screen.getByRole('button',{name:'I confirm and sign'}));
 expect((await screen.findByRole('alert')).textContent).toMatch(/Reload this page/);
 expect(screen.getByRole('button',{name:'I confirm and sign'})).toHaveProperty('disabled',true);
 expect(screen.queryByText('Your signed Bill of Sale is saved')).toBeNull();
});

it('requires a signer name even after a signature has been drawn',async()=>{
 render(<SellerSignPage/>);
 fireEvent.click(await screen.findByRole('button',{name:'Draw signature'}));
 fireEvent.change(screen.getByLabelText('Name of person signing'),{target:{value:'   '}});
 expect(screen.getByRole('button',{name:'I confirm and sign'})).toHaveProperty('disabled',true);
 fireEvent.submit(screen.getByRole('button',{name:'I confirm and sign'}).closest('form')!);
 expect(posts()).toHaveLength(0);
});

it('reopening a signed agreement shows its saved state without allowing another signature or claiming email delivery',async()=>{
 fetchMock.mockResolvedValue(Response.json({...preview,already_signed:true}));
 render(<SellerSignPage/>);
 await screen.findByText('Your signed Bill of Sale is saved');
 expect(screen.queryByRole('button',{name:'Draw signature'})).toBeNull();
 expect(screen.queryByRole('button',{name:'I confirm and sign'})).toBeNull();
 expect(screen.queryByText(/has been sent by email/)).toBeNull();
 expect(posts()).toHaveLength(0);
});

it('submits once while saving and only confirms email after a sent receipt',async()=>{
 let resolveSave!:(response:Response)=>void;
 fetchMock.mockImplementation((_url:string,init?:RequestInit)=>init?.method==='POST'
  ? new Promise<Response>(resolve=>{resolveSave=resolve;}) : Promise.resolve(Response.json(preview)));
 render(<SellerSignPage/>);
 fireEvent.click(await screen.findByRole('button',{name:'Draw signature'}));
 const form=screen.getByRole('button',{name:'I confirm and sign'}).closest('form')!;
 fireEvent.submit(form);fireEvent.submit(form);
 expect(posts()).toHaveLength(1);
 resolveSave(Response.json({ok:true,pickup_order_id:42,signature_id:7,receipt_email:{sent:true}}));
 await waitFor(()=>expect(screen.getByText(/has been sent by email/)).toBeTruthy());
});
