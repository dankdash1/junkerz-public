'use client';
import {useCallback,useEffect,useState} from 'react';
import {customerFetch,CustomerRequest} from '@/lib/customer-api';
import CustomerAccountState from '@/components/CustomerAccountState';
import YardRequestQuote from '@/components/YardRequestQuote';
import type {QuoteResult,YardQuote} from '@/lib/yard-requests';
import YardRequestConversation from '@/components/YardRequestConversation';
type RequestError=Error & {status?:number};
const requiresSignIn=(error:RequestError)=>error.status===401||error.status===403;
export default function Detail({params}:{params:{id:string}}){
 const [data,setData]=useState<CustomerRequest|null>(null);const [error,setError]=useState<RequestError|null>(null);const [paymentError,setPaymentError]=useState<RequestError|null>(null);const [paying,setPaying]=useState(false);
 const load=useCallback(async()=>{try{setData(await customerFetch<CustomerRequest>(`requests/${params.id}`));setError(null);}catch(e){setError(e as RequestError);}},[params.id]);
 const loadQuote=useCallback(()=>customerFetch<QuoteResult>(`requests/${params.id}/quote`),[params.id]);
 const respond=useCallback((quote:YardQuote,decision:'accept'|'decline',key:string)=>customerFetch<QuoteResult>(`requests/${params.id}/quote/respond`,{method:'POST',body:JSON.stringify({quote_id:quote.id,version:quote.version,decision,idempotency_key:key})}),[params.id]);
 const pay=async()=>{if(paying)return;setPaymentError(null);setPaying(true);try{const result=await customerFetch<{url:string}>(`requests/${params.id}/payment-session`,{method:'POST',body:'{}'});if(!result.url.startsWith('https://'))throw new Error('Payment link is unavailable');window.location.assign(result.url);}catch(e){setPaymentError(e as RequestError);setPaying(false);}};
 useEffect(()=>{void load();const refresh=()=>{if(!document.hidden)void load();};const timer=setInterval(refresh,15000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[load]);
 if(error&&!data)return <CustomerAccountState error={error.message} retry={load} showSignIn={requiresSignIn(error)}/>;if(!data)return <p role="status">Loading request…</p>;
 return <>{error&&<CustomerAccountState error={error.message} retry={load} showSignIn={requiresSignIn(error)}/>}<a href="/account" className="underline">← All requests</a><h1 className="mt-6 text-3xl font-bold">Request {data.reference}</h1><section className="my-6 rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">{data.component||data.vehicle_label}</h2><p className="mt-3">{data.customer_message}</p>{data.order_id&&<a href={`/account/orders/${encodeURIComponent(data.order_id)}`} className="mt-4 inline-flex min-h-11 items-center font-semibold underline">View order and payment status</a>}</section><YardRequestQuote loadQuote={loadQuote} respond={respond} onAccepted={load} paymentStatus={data.payment_status} onQuestion={()=>document.querySelector<HTMLTextAreaElement>('textarea')?.focus()}/>{paymentError&&<div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"><p>{paymentError.message}</p>{requiresSignIn(paymentError)&&<a href="/account/sign-in" className="mt-2 inline-block underline">Sign in to My Junkerz</a>}</div>}{data.payment_available&&<button disabled={paying} onClick={pay} className="mb-6 min-h-12 rounded-lg bg-brand-700 px-5 font-bold text-white">{paying?'Opening payment…':'Pay approved order'}</button>}<YardRequestConversation requestId={params.id}/></>;
}
