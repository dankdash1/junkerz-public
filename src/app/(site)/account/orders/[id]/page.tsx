'use client';
import {useCallback,useEffect,useState} from 'react';
import {customerFetch,CustomerRequest} from '@/lib/customer-api';
import CustomerAccountState from '@/components/CustomerAccountState';
export default function Order({params}:{params:{id:string}}){
 const [data,setData]=useState<CustomerRequest|null>(null);const [error,setError]=useState('');
 const load=useCallback(async()=>{try{setData(await customerFetch<CustomerRequest>(`orders/${encodeURIComponent(params.id)}`));setError('');}catch(e){setError((e as Error).message);}},[params.id]);
 useEffect(()=>{void load();const refresh=()=>{if(!document.hidden)void load();};window.addEventListener('focus',refresh);return()=>window.removeEventListener('focus',refresh);},[load]);
 if(error)return <CustomerAccountState error={error} retry={load}/>;if(!data)return <p role="status">Loading order…</p>;
 return <><a href="/account" className="underline">← All orders</a><h1 className="mt-6 text-3xl font-bold">Order {params.id}</h1><section className="mt-6 space-y-4 rounded-xl border bg-white p-6"><h2 className="text-xl font-bold">{data.component||data.vehicle_label}</h2><p>{data.customer_message}</p><dl className="grid grid-cols-2 gap-3"><dt>Payment</dt><dd>{data.payment_status||'Awaiting confirmation'}</dd><dt>Delivery</dt><dd>{data.order_status?.replaceAll('_',' ')||'Awaiting arrangements'}</dd><dt>Order total</dt><dd>{data.total!==undefined?`$${Number(data.total).toFixed(2)}`:'Not confirmed'}</dd><dt>Contact at ordering</dt><dd>{data.customer_name}<br/>{data.customer_email}</dd></dl>{data.receipt_available&&<a className="inline-flex min-h-11 items-center underline" href={`/api/customer/orders/${encodeURIComponent(params.id)}/receipt`} target="_blank" rel="noreferrer">Open payment receipt</a>}<p><a className="underline" href={`/account/requests/${data.id}`}>Ask Junkerz a question about this order</a></p></section></>;
}
