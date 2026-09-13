"use client";
import {useEffect,useState} from "react";
export default function PrivatePhoto({id,label,load}:{id:number;label:string;load:(id:number)=>Promise<Blob>}){
  const [url,setUrl]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>()=>{if(url) URL.revokeObjectURL(url);},[url]);
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    {url && <img src={url} alt={label} className="max-h-64 w-full object-contain"/>}
    <button type="button" className="min-h-12 w-full px-3 text-left text-sm font-medium" disabled={busy} onClick={async()=>{
      if(url){setUrl(null);return;}setBusy(true);setError('');
      try{setUrl(URL.createObjectURL(await load(id)));}catch{setError('Photo unavailable. Your link may have expired.');}finally{setBusy(false);}
    }}>{busy?'Loading…':url?`Hide ${label}`:`View ${label}`}</button>
    {error && <p role="alert" className="px-3 pb-3 text-sm text-red-700">{error}</p>}
  </div>;
}

