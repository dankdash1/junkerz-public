'use client';
import {useState} from 'react';
import {customerFetch} from '@/lib/customer-api';
export default function ClaimCustomerRequest({token}:{token:string}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [signIn,setSignIn]=useState(false);const [claimed,setClaimed]=useState(false);
 async function claim(){if(busy)return;setBusy(true);setError('');try{await customerFetch('claim-request',{method:'POST',body:JSON.stringify({capability:token})});setClaimed(true);}catch(e){if((e as {status?:number}).status===401)setSignIn(true);else setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="mt-7 rounded-xl border border-zinc-200 p-5"><h2 className="font-bold">Keep this request in My Junkerz</h2><p className="mt-2 text-sm">Sign in with the email used for this request to add it to your history.</p>{claimed?<a className="mt-3 inline-block underline" href="/account">Request added. Open My Junkerz</a>:signIn?<a className="mt-3 inline-block underline" href={`/account/sign-in#claim=${encodeURIComponent(token)}`}>Verify your email and add this request</a>:<button disabled={busy} onClick={claim} className="mt-3 min-h-11 rounded-lg border px-4">{busy?'Adding…':'Add to My Junkerz'}</button>}{error&&<p role="alert" className="mt-3 text-red-700">{error}</p>}</section>;
}
