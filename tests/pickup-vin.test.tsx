// George 2026-11-23: the buyer (yard) and the driver can type the VIN, so a
// missing VIN never blocks the pickup or the bill of sale.
import React from 'react';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {cleanup,render,screen,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PickupVinField from '@/components/junkerz/PickupVinField';
import PickupMobile from '@/components/junkerz/PickupMobile';
import BuyerDetail from '@/app/(site)/buyers/won-cars/[match_id]/page';
import {sellerAgreement} from './fixtures/seller-agreement';
import {normalizeVin,pickupVinError,vinLooksValid} from '@/lib/pickup-vin';

const GOOD='1HGCM82633A004352';
const driverApi=vi.hoisted(()=>({detail:vi.fn(),start:vi.fn(),arrive:vi.fn(),thirtyMinutes:vi.fn(),complete:vi.fn(),signature:vi.fn(),upload:vi.fn(),photo:vi.fn(),vin:vi.fn()}));
vi.mock('@/lib/pickup-access-api',async(importOriginal)=>({...await importOriginal<typeof import('@/lib/pickup-access-api')>(),createPickupAccessApi:()=>driverApi}));
const buyerApi=vi.hoisted(()=>({pickupDetail:vi.fn(),pickupSignature:vi.fn(),pickupComplete:vi.fn(),pickupVin:vi.fn()}));
vi.mock('@/lib/buyer-api',()=>({buyerApi}));
vi.mock('next/navigation',()=>({useParams:()=>({match_id:'42'}),useRouter:()=>({push:vi.fn()})}));
vi.mock('@/components/junkerz/SignaturePad',()=>({default:({disabled}:{disabled?:boolean})=><button disabled={disabled}>Draw signature</button>}));
vi.mock('@/components/junkerz/PickupShare',()=>({default:()=>null}));
vi.mock('@/components/junkerz/PickupStart',()=>({default:()=>null}));

beforeEach(()=>{vi.resetAllMocks();window.history.replaceState({},'','/pickup#token=private-capability');});
afterEach(cleanup);

test('VIN helpers: 17 characters, no I/O/Q, spaces and case ignored',()=>{
  expect(normalizeVin(' 1hgcm 82633a004352 ')).toBe(GOOD);
  expect(vinLooksValid(GOOD)).toBe(true);
  expect(vinLooksValid('1HGCM82633A00435O')).toBe(false);
  expect(vinLooksValid('SHORT')).toBe(false);
  expect(pickupVinError('bad_vin')).toBe('A VIN is 17 letters and numbers, no I, O or Q.');
  expect(pickupVinError('bill_of_sale_already_signed')).toMatch(/already signed/);
});

test('missing VIN: valid save calls the server with the cleaned VIN',async()=>{
  const onSave=vi.fn().mockResolvedValue({ok:true});
  render(<PickupVinField vin={null} signed={false} onSave={onSave}/>);
  expect(screen.getByText('Not recorded')).toBeTruthy();
  expect(screen.getByText(/Read it from the dashboard or the driver's door; also take the VIN plate photo\./)).toBeTruthy();
  await userEvent.type(screen.getByLabelText('Type the VIN'),'1hgcm82633a004352');
  await userEvent.click(screen.getByRole('button',{name:'Save VIN'}));
  await waitFor(()=>expect(onSave).toHaveBeenCalledWith(GOOD));
});

test('bad VIN is refused on the page without calling the server',async()=>{
  const onSave=vi.fn();
  render(<PickupVinField vin={null} signed={false} onSave={onSave}/>);
  await userEvent.type(screen.getByLabelText('Type the VIN'),'1HGCM82633A00435O');
  await userEvent.click(screen.getByRole('button',{name:'Save VIN'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','A VIN is 17 letters and numbers, no I, O or Q.');
  expect(onSave).not.toHaveBeenCalled();
});

test('server refusal after signing shows a plain message',async()=>{
  const onSave=vi.fn().mockRejectedValue(new Error('bill_of_sale_already_signed'));
  render(<PickupVinField vin={null} signed={false} onSave={onSave}/>);
  await userEvent.type(screen.getByLabelText('Type the VIN'),GOOD);
  await userEvent.click(screen.getByRole('button',{name:'Save VIN'}));
  expect((await screen.findByRole('alert')).textContent).toMatch(/already signed/);
});

test('present VIN unsigned shows Edit; signed shows no input and no Edit',async()=>{
  const view=render(<PickupVinField vin={GOOD} signed={false} onSave={vi.fn()}/>);
  expect(screen.queryByLabelText('Type the VIN')).toBeNull();
  await userEvent.click(screen.getByRole('button',{name:'Edit'}));
  expect(screen.getByLabelText('Correct the VIN')).toBeTruthy();
  view.unmount();
  render(<PickupVinField vin={GOOD} signed onSave={vi.fn()}/>);
  expect(screen.queryByRole('button',{name:'Edit'})).toBeNull();
  expect(screen.queryByRole('button',{name:'Save VIN'})).toBeNull();
});

const driverDetail={pickup_order_id:42,status:'arrived',arrived_at:'2026-11-23T18:00:00Z',vehicle:{year:2011,make:'Honda',model:'Civic',vin:null,condition:'runs'},seller:{name:'Test Seller',phone:null,email:null},pickup_address:'Test address',slot:null,eta_at:null,offer_cents:30000,photos:[],seller_signature:null,completed_at:null,agreement:{...sellerAgreement,vin:null}};

test('driver page: save VIN, refresh, and the signature section unlocks with the new VIN',async()=>{
  driverApi.detail.mockResolvedValue(driverDetail);
  render(<PickupMobile/>);
  await screen.findByText('2011 Honda Civic');
  expect(screen.getByRole('button',{name:'Draw signature'})).toHaveProperty('disabled',true);
  await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
  driverApi.vin.mockResolvedValue({ok:true,vin:GOOD});
  driverApi.detail.mockResolvedValue({...driverDetail,vehicle:{...driverDetail.vehicle,vin:GOOD},agreement:{...sellerAgreement,vin:GOOD}});
  await userEvent.type(screen.getByLabelText('Type the VIN'),GOOD);
  await userEvent.click(screen.getByRole('button',{name:'Save VIN'}));
  await waitFor(()=>expect(driverApi.vin).toHaveBeenCalledWith('Test Driver',GOOD));
  expect(await screen.findByText('VIN saved. The bill of sale now shows it.')).toBeTruthy();
  expect(screen.getByText(`VIN: ${GOOD}`)).toBeTruthy();
  expect(screen.getByRole('button',{name:'Draw signature'})).toHaveProperty('disabled',false);
});

test('driver page: a bad or expired link is shown plainly',async()=>{
  driverApi.detail.mockResolvedValue(driverDetail);
  render(<PickupMobile/>);
  await screen.findByText('2011 Honda Civic');
  await userEvent.type(screen.getByLabelText('Your name'),'Test Driver');
  driverApi.vin.mockRejectedValue(new Error('This pickup link is unavailable or has expired. Ask the buyer for a new link.'));
  await userEvent.type(screen.getByLabelText('Type the VIN'),GOOD);
  await userEvent.click(screen.getByRole('button',{name:'Save VIN'}));
  expect((await screen.findByRole('alert')).textContent).toMatch(/unavailable or has expired/);
});

const buyerDetail={match_id:42,match_status:'won',purchase_status:'arrived',po_status:'arrived',bid_cents:70000,offer_cents:33000,contact_name:'Test Seller',vin:null,signatures:[],photos:[],completion:{buyer_completed_at:null},agreement:{...sellerAgreement,vin:null}};

test('buyer won-car page: winning buyer saves the VIN and the page reloads',async()=>{
  buyerApi.pickupDetail.mockResolvedValue(buyerDetail);
  render(<BuyerDetail/>);
  await userEvent.type(await screen.findByLabelText('Type the VIN'),GOOD);
  buyerApi.pickupVin.mockResolvedValue({ok:true,vin:GOOD});
  buyerApi.pickupDetail.mockResolvedValue({...buyerDetail,vin:GOOD,agreement:sellerAgreement});
  await userEvent.click(screen.getByRole('button',{name:'Save VIN'}));
  await waitFor(()=>expect(buyerApi.pickupVin).toHaveBeenCalledWith(42,GOOD));
  await waitFor(()=>expect(buyerApi.pickupDetail).toHaveBeenCalledTimes(2));
  expect(await screen.findByRole('button',{name:'Edit'})).toBeTruthy();
});

test('buyer won-car page: wrong buyer refusal is shown, nothing else changes',async()=>{
  buyerApi.pickupDetail.mockResolvedValue(buyerDetail);
  render(<BuyerDetail/>);
  await userEvent.type(await screen.findByLabelText('Type the VIN'),GOOD);
  buyerApi.pickupVin.mockRejectedValue(new Error('match_not_found_for_buyer'));
  await userEvent.click(screen.getByRole('button',{name:'Save VIN'}));
  expect((await screen.findByRole('alert')).textContent).toBe('Could not save the VIN. Try again.');
  expect(buyerApi.pickupDetail).toHaveBeenCalledTimes(1);
});
