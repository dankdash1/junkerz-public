import React from 'react';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Detail from '@/app/buyers/won-cars/[match_id]/page';
import {sellerAgreement} from './fixtures/seller-agreement';
const api=vi.hoisted(()=>({pickupDetail:vi.fn(),pickupSignature:vi.fn(),pickupComplete:vi.fn()}));
vi.mock('@/lib/buyer-api',()=>({buyerApi:api}));
vi.mock('next/navigation',()=>({useParams:()=>({match_id:'42'}),useRouter:()=>({push:vi.fn()})}));
vi.mock('@/components/junkerz/SignaturePad',()=>({default:({onChange}:{onChange:(value:string)=>void})=><button onClick={()=>onChange('ink')}>Draw signature</button>}));
const detail={match_id:42,match_status:'won',purchase_status:'arrived',po_status:'arrived',bid_cents:70000,offer_cents:33000,contact_name:'Test Seller',signatures:[],photos:[],completion:{buyer_completed_at:null},agreement:sellerAgreement};
beforeEach(()=>{vi.resetAllMocks();api.pickupDetail.mockResolvedValue(detail);});
afterEach(cleanup);
async function openSigning(){
 render(<Detail/>);
 await userEvent.click(await screen.findByRole('button',{name:/at the car/}));
 await userEvent.click(screen.getByRole('button',{name:'Draw signature'}));
}
test('buyer pickup submits the reviewed agreement revision and hides current terms after signing',async()=>{
 await openSigning();
 expect(screen.getByText(sellerAgreement.buyer_address)).toBeTruthy();
 expect(screen.getByText(sellerAgreement.agreement_text)).toBeTruthy();
 api.pickupSignature.mockResolvedValue({ok:true});
 api.pickupDetail.mockResolvedValue({...detail,signatures:[{signer_role:'seller',signer_name:'Test Seller',signed_at:'2026-11-14T12:00:00Z'}],agreement:{...sellerAgreement,agreement_text:'Changed terms'}});
 await userEvent.click(screen.getByRole('button',{name:'Save signature'}));
 await waitFor(()=>expect(api.pickupSignature).toHaveBeenCalledWith(42,{signer_role:'seller',signer_name:'Test Seller',signature:'ink',document_revision:'preview-revision-1'}));
 await screen.findByRole('button',{name:'Download signed bill of sale'});
 expect(screen.queryByRole('region',{name:'Bill of Sale agreement'})).toBeNull();
 expect(screen.queryByText('Changed terms')).toBeNull();
 expect(api.pickupComplete).not.toHaveBeenCalled();
});
test.each([
 {agreement:undefined},
 {agreement:{...sellerAgreement,buyer_address:''}},
 {agreement:{...sellerAgreement,seller_address:''}},
 {agreement:{...sellerAgreement,vin:''}},
 {agreement:{...sellerAgreement,seller_price_cents:0}},
 {agreement:{...sellerAgreement,document_revision:''}},
])('blocks incomplete agreement %j',async override=>{
 api.pickupDetail.mockResolvedValue({...detail,...override});
 await openSigning();
 expect(screen.getByRole('button',{name:'Save signature'})).toHaveProperty('disabled',true);
 expect(api.pickupSignature).not.toHaveBeenCalled();
});
test('changed revision locks signature until reload and never completes pickup',async()=>{
 api.pickupSignature.mockRejectedValue(new Error('document_changed'));
 await openSigning();
 await userEvent.click(screen.getByRole('button',{name:'Save signature'}));
 await screen.findByText(/The agreement changed/);
 expect(screen.getByRole('button',{name:'Save signature'})).toHaveProperty('disabled',true);
 expect(api.pickupSignature).toHaveBeenCalledTimes(1);
 expect(api.pickupComplete).not.toHaveBeenCalled();
});
