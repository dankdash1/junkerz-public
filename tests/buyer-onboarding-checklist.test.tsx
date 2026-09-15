import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingChecklist from '@/components/buyers/OnboardingChecklist';
import Documents from '@/app/buyers/signup/documents/page';
import Dashboard from '@/app/buyers/dashboard/page';
import Recovery from '@/app/buyers/recover/page';
import Signup from '@/app/buyers/signup/page';
const api = vi.hoisted(() => ({ signupConfig:vi.fn(), onboardingStatus: vi.fn(), listDocuments:vi.fn(), me:vi.fn(), uploadDocument:vi.fn(), signTerms:vi.fn(), requestRecovery:vi.fn(), consumeRecovery:vi.fn() }));
const replace = vi.hoisted(() => vi.fn());
vi.mock('@/lib/buyer-api', () => ({ buyerApi: api }));
vi.mock('next/navigation', () => ({ useRouter: () => ({replace}) }));
const status = {policy_version:2, approval_ready:false, payment_ready:true, approved:false, active:false, items:[
  {key:'w9',label:'W-9',kind:'document' as const,required:true,requested:true,completed:true,review_status:'uploaded',next_action_url:'/buyers/signup/documents#w9'},
  {key:'insurance',label:'Insurance certificate',kind:'document' as const,required:true,requested:true,completed:false,review_status:'missing',next_action_url:'/buyers/signup/documents#insurance'},
  {key:'license',label:'Business license',kind:'document' as const,required:false,requested:true,completed:false,review_status:'missing',next_action_url:'/buyers/signup/documents#license'},
]};
beforeEach(() => {vi.resetAllMocks(); Object.defineProperty(window, 'localStorage', {configurable:true, value:{getItem:vi.fn(() => 'test'),setItem:vi.fn(),removeItem:vi.fn()}}); api.onboardingStatus.mockResolvedValue(status); api.signupConfig.mockResolvedValue({required_fields:[],all_fields:[],onboarding:status}); api.listDocuments.mockResolvedValue({documents:[{id:1,license_type:'w9',status:'uploaded'}]}); api.me.mockResolvedValue({business_name:'Test Yard',active:false,balance_cents:0});});
afterEach(cleanup);
test('required and requested items remain distinct from upload review and card readiness', () => {
  render(<OnboardingChecklist status={status}/>);
  expect(screen.getByText('Uploaded · awaiting review')).toBeTruthy();
  expect(screen.getAllByText('Required')).toHaveLength(2);
  expect(screen.getByText('Requested · optional')).toBeTruthy();
  expect(screen.getByText('Payment method ready')).toBeTruthy();
  expect(screen.getByText('Business approval pending')).toBeTruthy();
});
test('documents reload persisted progress and skip returns to dashboard', async () => {
 render(<Documents/>);
 expect(await screen.findByText('Uploaded · awaiting review')).toBeTruthy();
 await userEvent.click(screen.getByRole('button',{name:'Skip for now'}));
 expect(replace).toHaveBeenCalledWith('/buyers/dashboard');
});
test('dashboard renders the same missing policy item with a return link', async () => {
 render(<Dashboard/>);
 expect(await screen.findByText('Insurance certificate')).toBeTruthy();
 expect(screen.getByRole('link',{name:'Complete Insurance certificate'}).getAttribute('href')).toBe('/buyers/signup/documents#insurance');
});
test('recovery requests email and requires explicit password submission for a token', async () => {
 window.history.replaceState({},'', '/buyers/recover');
 api.requestRecovery.mockResolvedValue({ok:true,message:'If an account exists, a recovery email will arrive shortly.'});
 const view = render(<Recovery/>);
 await userEvent.type(await screen.findByLabelText('Login email'),'buyer@example.com');
 await userEvent.click(screen.getByRole('button',{name:'Send recovery email'}));
 expect(await screen.findByText(/If an account exists/)).toBeTruthy();
 view.unmount();
 window.history.replaceState({},'', '/buyers/recover#token=opaque-token');
 api.consumeRecovery.mockResolvedValue({ok:true});
 render(<Recovery/>);
 await userEvent.type(await screen.findByLabelText('New password'),'NewPassword123!');
 expect(api.consumeRecovery).not.toHaveBeenCalled();
 await userEvent.click(screen.getByRole('button',{name:'Reset password'}));
 expect(api.consumeRecovery).toHaveBeenCalledWith('opaque-token','NewPassword123!');
 expect(await screen.findByText(/Password updated/)).toBeTruthy();
 expect(window.location.hash).toBe('');
});

test('signup previews the same required documents without claiming they are uploaded', async () => {
 render(<Signup/>);
 expect(await screen.findByText('Insurance certificate')).toBeTruthy();
 expect(screen.getAllByText('Required')).toHaveLength(2);
 expect(screen.getByText('Requested · optional')).toBeTruthy();
 expect(screen.queryByText('Uploaded · awaiting review')).toBeNull();
});
