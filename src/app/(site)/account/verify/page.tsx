'use client';
import {useEffect,useState} from 'react';
import {customerFetch} from '@/lib/customer-api';
export default function Verify(){
 const [challenge,setChallenge]=useState('');const [busy,setBusy]=useState(false);const [done,setDone]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{setChallenge(new URLSearchParams(window.location.hash.slice(1)).get('challenge')||'');},[]);
 async function confirm(){if(busy)return;setBusy(true);setError('');try{await customerFetch('verify',{method:'POST',body:JSON.stringify({challenge})});setDone(true);window.history.replaceState(null,'','/account/verify');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="mx-auto max-w-lg rounded-2xl border bg-white p-7"><h1 className="text-3xl font-bold">Confirm your sign-in</h1>{done?<><p className="mt-5" role="status">You are signed in.</p><a href="/account" className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-brand-700 px-5 font-bold text-white">Continue to My Junkerz</a></>:<><p className="mt-4">Confirm to open My Junkerz on this device. Your saved request will be waiting for you.</p>{error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}{challenge?<button className="mt-6 min-h-12 rounded-lg bg-brand-700 px-5 font-bold text-white disabled:opacity-50" disabled={busy} onClick={confirm}>{busy?'Confirming…':'Confirm sign-in'}</button>:<p className="mt-4">Open the full link from your email to continue.</p>}<p className="mt-5"><a className="underline" href="/account/sign-in">Request a new link or sign in on another device</a></p></>}</section>;
}
