'use client';
import {useEffect,useRef,useState} from 'react';
import {customerFetch,type DepositState} from '@/lib/customer-api';
import {money} from '@/lib/money';

type PayError=Error&{status?:number};
const PAID_HOW:Record<string,string>={online:'online',pickup_code:'in person with the pickup code',cash:'in cash'};
const METHOD:Record<string,string>={online:'online',cash_in_person:'in person when you collect'};
const date=(iso?:string|null)=>iso?new Date(iso).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}):'';

/** Deposit then balance for an approved parts-request quote. Every amount comes from the server. */
export default function YardDepositPayment({requestId,deposit,onChanged}:{requestId:string;deposit:DepositState;onChanged:()=>void}){
 const [agreed,setAgreed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const confirmed=useRef(false);
 // Back from Stripe (?payment=deposit|balance): confirm that payment even if the webhook is slow.
 useEffect(()=>{
  if(confirmed.current||typeof window==='undefined')return;
  const kind=new URLSearchParams(window.location.search).get('payment');
  if(kind!=='deposit'&&kind!=='balance')return;
  confirmed.current=true;
  customerFetch(`requests/${requestId}/payment-session`,{method:'POST',body:JSON.stringify({kind,confirm:true})}).catch(()=>undefined).finally(()=>{
   window.history.replaceState(null,'',window.location.pathname);onChanged();
  });
 },[requestId,onChanged]);
 const pay=async(kind:'deposit'|'balance')=>{
  if(busy)return;setBusy(true);setError('');
  const body=kind==='deposit'&&deposit.agreement?{kind,agree:agreed,agreement_version:deposit.agreement.version,agreement_sha256:deposit.agreement.sha256}:{kind};
  try{
   const result=await customerFetch<{url?:string;status?:string}>(`requests/${requestId}/payment-session`,{method:'POST',body:JSON.stringify(body)});
   if(result.url){if(!result.url.startsWith('https://checkout.stripe.com/'))throw new Error('Payment link is unavailable');window.location.assign(result.url);return;}
   onChanged();setBusy(false);
  }catch(e){const reason=e as PayError;setError(reason.message||'Could not open the payment. Try again.');if(reason.status===409)onChanged();setBusy(false);}
 };
 const depositPaid=deposit.deposit_status==='paid',balancePaid=deposit.balance_status==='paid';
 return <section aria-label="Deposit and balance" className="my-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900">
  <h2 className="text-xl font-bold">Payment</h2>
  {deposit.test_mode&&<p role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950">Test mode: no real money is taken. Use a Stripe test card.</p>}
  <dl className="space-y-2">
   <div className="flex justify-between"><dt>Total (includes {money(deposit.tax_cents)} tax)</dt><dd>{money(deposit.total_cents)}</dd></div>
   <div className="flex justify-between font-semibold"><dt>Deposit{depositPaid?' · paid':''} <span className="font-normal text-zinc-600">(includes {money(deposit.deposit_tax_cents)} tax)</span></dt><dd>{money(deposit.deposit_cents)}</dd></div>
   <div className="flex justify-between"><dt>Balance{balancePaid?` · paid ${PAID_HOW[deposit.balance_paid_how||'']||''}`:''} <span className="text-zinc-600">(includes {money(deposit.balance_tax_cents)} tax)</span></dt><dd>{money(deposit.balance_cents)}</dd></div>
  </dl>
  {deposit.hold_until&&<p className="text-sm">{deposit.hold_ended?<strong>The hold on this part ended {date(deposit.hold_until)}.</strong>:<>Part held until <strong>{date(deposit.hold_until)}</strong> ({deposit.hold_days} days from approval).</>}</p>}
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
  {!depositPaid&&deposit.agreement&&<div className="space-y-3">
   <div className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl border bg-zinc-50 p-3 text-sm" aria-label="Deposit terms">{deposit.agreement.text}</div>
   <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>I have read and agree to the deposit terms above{deposit.deposit_refundable===false?', including that the deposit is not refunded':''}.</span></label>
   {deposit.online_payments_on?<button type="button" disabled={!agreed||busy||!deposit.deposit_payment_available} onClick={()=>pay('deposit')} className="min-h-12 w-full rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50">{busy?'Opening payment…':`Pay deposit ${money(deposit.deposit_cents)}`}</button>:<p className="text-sm text-zinc-600">Online payment is not switched on yet. Junkerz will contact you.</p>}
   {deposit.online_payments_on&&!deposit.deposit_payment_available&&<p className="text-sm text-zinc-600">This quote can no longer take a deposit online. Ask Junkerz for an updated quote.</p>}
  </div>}
  {depositPaid&&!balancePaid&&<div className="space-y-3">
   {deposit.pickup_code&&<div className="rounded-xl border-2 border-brand-700 p-4 text-center"><p className="text-sm">Your pickup code</p><p className="font-mono text-3xl font-bold tracking-widest">{deposit.pickup_code}</p><p className="mt-1 text-xs text-zinc-600">Show this code when you pay the balance and collect the part. Do not share it.</p></div>}
   {deposit.balance_methods.length>0&&<p className="text-sm">You can pay the balance {deposit.balance_methods.map(m=>METHOD[m]||m).join(' or ')}.</p>}
   {deposit.balance_online_available&&<button type="button" disabled={busy} onClick={()=>pay('balance')} className="min-h-12 w-full rounded-xl bg-brand-700 px-5 font-bold text-white disabled:opacity-50">{busy?'Opening payment…':`Pay balance ${money(deposit.balance_cents)} online`}</button>}
  </div>}
  {depositPaid&&balancePaid&&<p role="status" className="rounded-xl bg-green-50 p-3 font-semibold text-green-900">Paid in full. Thank you.</p>}
 </section>;
}
