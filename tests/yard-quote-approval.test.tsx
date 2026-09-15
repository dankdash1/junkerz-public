import React from 'react';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import YardRequestQuote from '../src/components/YardRequestQuote';
afterEach(cleanup);
const quote={id:'q1',request_id:'r1',version:2,status:'published',part_id:10,quantity:1,item_price_cents:12500,delivery_cents:1500,tax_cents:125,fees_cents:0,total_cents:14125,currency:'usd',condition:'Good used condition',fitment:'Exact ALT-10',delivery_address:{street:'456 Buyer Ave',city:'OKC',state:'OK',postal_code:'73102'},delivery_terms:'Front entrance',return_terms:'Returns agreed',core_terms:'No core charge',expires_at:'2099-01-01T00:00:00Z'} as const;
describe('customer quote decisions',()=>{
 it('shows itemized immutable terms and approval creates an unpaid state',async()=>{
  const respond=vi.fn(async()=>({quote:{...quote,status:'accepted',order_id:'order1'}}));
  render(<YardRequestQuote loadQuote={async()=>({quote})} respond={respond}/>);
  expect(await screen.findByText('$141.25')).toBeTruthy();expect(screen.getByText('Exact ALT-10')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Approve quote'}));
  await waitFor(()=>expect(respond).toHaveBeenCalledWith(expect.objectContaining({id:'q1',version:2}),'accept',expect.any(String)));
  expect(await screen.findByText(/Approved · payment pending/)).toBeTruthy();expect(screen.queryByRole('button',{name:'Approve quote'})).toBeNull();
 });
 it('retains the same response key on retry and allows asking questions',async()=>{
  const respond=vi.fn().mockRejectedValueOnce(new Error('Connection interrupted')).mockResolvedValue({quote:{...quote,status:'declined'}});const question=vi.fn();
  render(<YardRequestQuote loadQuote={async()=>({quote})} respond={respond} onQuestion={question}/>);
  fireEvent.click(await screen.findByRole('button',{name:'Ask a question'}));expect(question).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button',{name:'Decline quote'}));await screen.findByText('Connection interrupted');
  fireEvent.click(screen.getByRole('button',{name:'Decline quote'}));await screen.findByText(/Quote declined/);
  expect(respond.mock.calls[0][2]).toBe(respond.mock.calls[1][2]);
 });
 it('reloads a stale quote after conflict and requires reviewing new terms',async()=>{
  const load=vi.fn().mockResolvedValueOnce({quote}).mockResolvedValue({quote:{...quote,id:'q2',version:3,total_cents:15000}});
  render(<YardRequestQuote loadQuote={load} respond={async()=>{throw Object.assign(new Error('Changed'),{status:409})}}/>);
  fireEvent.click(await screen.findByRole('button',{name:'Approve quote'}));expect(await screen.findByText('$150.00')).toBeTruthy();expect(screen.getByRole('alert').textContent).toMatch(/Review/);
 });
});

it('shows unavailable stock as requiring review and removes approval',async()=>{
 render(<YardRequestQuote loadQuote={async()=>({quote:{...quote,status:'unavailable'}})} respond={async()=>({quote})}/>);
 expect(await screen.findByText(/Stock is unavailable or changed/)).toBeTruthy();expect(screen.queryByRole('button',{name:'Approve quote'})).toBeNull();
});
