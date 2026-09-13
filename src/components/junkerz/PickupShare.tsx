"use client";
import {useState} from "react";
import {Copy,Share2} from "lucide-react";
import {buyerApi} from "@/lib/buyer-api";
import {Button} from "@/components/ui/button";
export default function PickupShare({matchId,completed=false}:{matchId:number;completed?:boolean}){
  const [link,setLink]=useState<{url:string;expires_at:string}|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const copy=async()=>{
    if(!link)return;
    setError('');
    try{await navigator.clipboard.writeText(link.url);setNotice('Pickup link copied. Forward it only to the person collecting this car.');}
    catch{setError('Could not copy the link. Use Share on a supported device.');}
  };
  return <section className="rounded-lg border bg-white p-4 space-y-3">
    <h2 className="font-semibold">{completed ? "Driver link access" : "Forward this pickup"}</h2>
    <p className="text-sm text-slate-600">{completed ? "Pickup is completed. Forwarded links can still view this pickup’s photos and seller information until they expire. Disable the link to end that access now." : "Your driver opens one pickup without a buyer login. They can add photos and the seller’s signature, send arrival updates, and complete collection. Updates appear here in your office record."}</p>
    {!completed && <p className="text-xs text-slate-500">Creating a replacement disables earlier copies, including links in forwarded emails. Only share with your assigned driver.</p>}
    {!completed && link && <div className="flex flex-wrap gap-2"><Button onClick={async()=>{
      if(navigator.share){try{await navigator.share({title:'Junkerz pickup',text:'Open this pickup on your phone.',url:link.url});}catch(e){if((e as Error).name!=='AbortError')setError('Sharing is unavailable. Use Copy link.');}}
      else await copy();
    }}><Share2 className="mr-2 h-4 w-4"/>Share pickup link</Button><Button variant="outline" onClick={()=>void copy()}><Copy className="mr-2 h-4 w-4"/>Copy link</Button></div>}
    {!completed && link && <p className="text-xs text-slate-500">Link expires {new Date(link.expires_at).toLocaleString()}.</p>}
    <div className="flex flex-wrap gap-2">{!completed && <Button variant="outline" disabled={busy} onClick={async()=>{
      setBusy(true);setError('');setNotice('');setLink(null);
      try{
        const next=await buyerApi.createPickupAccessLink(matchId);
        const parsed=new URL(next.url);
        if(!['https:','http:'].includes(parsed.protocol) || parsed.pathname!='/pickup' || !new URLSearchParams(parsed.hash.slice(1)).get('token'))throw new Error('Pickup link is invalid. Please contact support.');
        setLink(next);setNotice('New pickup link ready. Earlier links no longer work.');
      }catch(e){setError((e as Error).message || 'Could not create link.');}finally{setBusy(false);}
    }}>{busy?'Updating…':'Create / replace pickup link'}</Button>}<Button variant="outline" disabled={busy} onClick={async()=>{
      setBusy(true);setError('');setNotice('');
      try{await buyerApi.revokePickupAccessLink(matchId);setLink(null);setNotice('Pickup link disabled. Every forwarded copy is now unavailable.');}
      catch(e){setError((e as Error).message || 'Could not disable link.');}finally{setBusy(false);}
    }}>Disable pickup link</Button></div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="text-sm text-slate-700">{notice}</p>}
  </section>;
}
