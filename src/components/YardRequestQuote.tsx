'use client';
import React,{useEffect,useRef,useState} from 'react';
import type {QuoteResult,YardQuote} from '@/lib/yard-requests';

export default function YardRequestQuote({loadQuote,respond,onQuestion,onAccepted,paymentStatus}:{
 loadQuote:()=>Promise<QuoteResult>;respond:(quote:YardQuote,decision:'accept'|'decline',key:string)=>Promise<QuoteResult>;
 onQuestion?:()=>void;onAccepted?:()=>void;paymentStatus?:string;
}) {
 const [quote,setQuote]=useState<YardQuote|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const attempt=useRef<{id:string;decision:string;key:string}|null>(null);
 useEffect(()=>{let active=true;loadQuote().then(data=>{if(active)setQuote(data.quote)}).catch(e=>{if(active)setError(e.message||'Could not load quote')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[loadQuote]);
 const decide=async(decision:'accept'|'decline')=>{
  if(!quote||busy)return;setBusy(true);setError('');
  if(attempt.current?.id!==quote.id||attempt.current?.decision!==decision)attempt.current={id:quote.id,decision,key:crypto.randomUUID()};
  try{const result=await respond(quote,decision,attempt.current.key);setQuote(result.quote);if(decision==='accept')onAccepted?.()}
  catch(e){const reason=e as Error&{status?:number};if(reason.status===409){try{setQuote((await loadQuote()).quote);attempt.current=null;setError('This quote changed. Review the latest details before responding again.')}catch{setError('Could not reload the quote. Refresh and review it before responding.')}}else setError(reason.message||'Could not save your response. Try again.')}
  finally{setBusy(false)}
 };
 const money=(cents:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:quote?.currency||'USD'}).format(cents/100);
 if(loading)return <p role="status" className="mt-6">Checking quote…</p>;
 if(!quote&&!error)return null;
 const expired=quote&&new Date(quote.expires_at).getTime()<=Date.now();
 return <section aria-label="Your quote" className="my-7 space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900">
  <h2 className="text-xl font-bold">Your quote{quote?` · version ${quote.version}`:''}</h2>
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
  {quote&&<>
   <p className="text-sm text-zinc-600">{quote.part_id?`Part #${quote.part_id}`:`Vehicle #${quote.car_id}`} · Quantity {quote.quantity}</p>
   <p>{quote.condition}</p><p>{quote.fitment}</p>
   <dl className="space-y-2">{[['Item',quote.item_price_cents],['Delivery',quote.delivery_cents],['Tax',quote.tax_cents],['Fees',quote.fees_cents]].map(([name,cents])=><div className="flex justify-between" key={name}><dt>{name}</dt><dd>{money(Number(cents))}</dd></div>)}<div className="flex justify-between border-t pt-3 text-lg font-bold"><dt>Total</dt><dd>{money(quote.total_cents)}</dd></div></dl>
   <div className="space-y-2 text-sm"><p><strong>Delivery to:</strong> {Object.values(quote.delivery_address).join(', ')}</p><p>{quote.delivery_terms}</p><p><strong>Returns:</strong> {quote.return_terms}</p><p><strong>Core:</strong> {quote.core_terms}</p><p>Expires {new Date(quote.expires_at).toLocaleString()}</p></div>
   {quote.status==='accepted'?<p role="status" className="rounded-xl bg-amber-50 p-3 font-semibold">{paymentStatus==='paid'?'Approved · payment confirmed':'Approved · payment pending'}</p>:quote.status==='unavailable'?<p role="status">Stock is unavailable or changed. Junkerz must review it before offering a new quote.</p>:quote.status==='declined'?<p role="status">Quote declined. You can send us a question.</p>:expired||quote.status==='expired'?<p role="status">This quote expired. Ask us for an updated quote.</p>:quote.status==='superseded'?<p role="status">A newer quote is available. Refresh to review it.</p>:<div className="grid gap-3 sm:grid-cols-2"><button type="button" disabled={busy} onClick={()=>decide('accept')} className="min-h-12 rounded-xl bg-brand-600 px-4 font-bold text-white disabled:opacity-50">{busy?'Saving response…':'Approve quote'}</button><button type="button" disabled={busy} onClick={()=>decide('decline')} className="min-h-12 rounded-xl border px-4 font-semibold disabled:opacity-50">Decline quote</button></div>}
   {onQuestion&&<button type="button" onClick={onQuestion} className="min-h-11 w-full rounded-xl border px-4 font-semibold">Ask a question</button>}
  </>}
 </section>;
}
