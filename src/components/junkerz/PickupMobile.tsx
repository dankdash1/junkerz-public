"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {Camera,Check,ChevronRight,Clock,MapPin,Phone,ShieldCheck,Truck} from "lucide-react";
import PrivatePhoto from "@/components/junkerz/PrivatePhoto";
import SignaturePad from "@/components/junkerz/SignaturePad";
import {createPickupAccessApi,PickupAccessError,type PickupAccessDetail} from "@/lib/pickup-access-api";

const actionClass="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500";
const inputClass="mt-2 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-950 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950";
const kinds=[['exterior_front','Front'],['exterior_rear','Rear'],['exterior_left','Left side'],['exterior_right','Right side'],['interior','Interior'],['odometer','Odometer'],['vin_plate','VIN'],['title_document','Title'],['id_document','Seller ID · private'],['damage','Damage']] as const;
const dateTime=(value:string)=>new Date(value).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'});


function Step({number,title,children}:{number:string;title:string;children:React.ReactNode}){
  return <section className="border-t border-slate-200 py-6">
    <div className="mb-5 flex items-center gap-3"><span className="font-mono text-sm text-slate-400">{number}</span><h2 className="text-xl font-semibold tracking-tight">{title}</h2></div>
    {children}
  </section>;
}

export default function PickupMobile(){
  const [token,setToken]=useState<string|null>(null);
  const [detail,setDetail]=useState<PickupAccessDetail|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState<string|null>(null);
  const [driver,setDriver]=useState('');
  const [eta,setEta]=useState('30');
  const [sellerName,setSellerName]=useState('');
  const [signature,setSignature]=useState<string|null>(null);
  const [collected,setCollected]=useState(false);
  const api=useMemo(()=>token?createPickupAccessApi(token):null,[token]);

  useEffect(()=>{
    const value=new URLSearchParams(window.location.hash.slice(1)).get('token');
    if(value){setToken(value);}else{setError('Open the complete pickup link from your assignment email. Ask the buyer to forward it again if the link is incomplete.');setLoading(false);}
  },[]);
  const refresh=useCallback(async()=>{
    if(!api)return;
    const next=await api.detail();setDetail(next);
    setSellerName(name=>name || next.seller.name || '');
  },[api]);
  useEffect(()=>{
    if(!api)return;
    void refresh().catch(e=>setError((e as Error).message || 'Pickup unavailable.')).finally(()=>setLoading(false));
  },[api,refresh]);
  const run=async(key:string,work:()=>Promise<unknown>,message:string)=>{
    if(busy || !driver.trim())return;
    setBusy(key);setError('');setNotice('');
    try{await work();await refresh();setNotice(message);}
    catch(e){if(e instanceof PickupAccessError && [401,403].includes(e.status))setDetail(null);setError((e as Error).message || 'Could not save. Try again.');}
    finally{setBusy(null);}
  };
  if(loading)return <main className="min-h-screen bg-stone-50 px-6 py-16 text-center"><Truck className="mx-auto mb-4 h-8 w-8"/><p>Opening your pickup…</p></main>;
  if(!detail || !api)return <main className="mx-auto min-h-screen max-w-lg bg-stone-50 px-6 py-16"><p className="mb-6 font-mono text-xs uppercase tracking-widest">Junkerz / Pickup</p><h1 className="text-3xl font-semibold tracking-tight">Pickup link unavailable</h1><p role="alert" className="mt-4 leading-relaxed text-slate-600">{error}</p></main>;
  const completed=!!detail.completed_at || detail.status==='completed';
  const closed=completed || ['cancelled','disputed'].includes(detail.status);
  const identified=driver.trim().length>0;
  const vehicle=[detail.vehicle.year,detail.vehicle.make,detail.vehicle.model].filter(Boolean).join(' ') || 'Vehicle pickup';
  const enRoute=detail.status==='en_route';
  return <main className="min-h-screen bg-stone-50 text-slate-950">
    <div className="mx-auto max-w-lg px-5 pb-16">
      <header className="flex items-center justify-between border-b border-slate-200 py-5"><span className="text-xl font-black tracking-tighter">JUNKERZ<span className="text-brand-600">.</span></span><span className="font-mono text-xs uppercase tracking-widest text-slate-500">Pickup {detail.pickup_order_id}</span></header>
      <div className="py-7">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${completed?'bg-emerald-100 text-emerald-900':'bg-slate-950 text-white'}`}>{completed?<Check size={14}/>:<Truck size={14}/>} {completed?'Pickup completed':enRoute?'On the way':detail.status.replace(/_/g,' ')}</span>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">{vehicle}</h1>
        <p className="mt-2 font-mono text-xs text-slate-500">VIN {detail.vehicle.vin || 'Not recorded'}</p>
      </div>
      <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex gap-3 border-b border-slate-100 p-5"><Clock size={20} className="mt-0.5 shrink-0 text-brand-600"/><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scheduled pickup</p><p className="mt-1 font-semibold">{detail.scheduled_for ? (/^\d{4}-\d{2}-\d{2}$/.test(detail.scheduled_for) ? new Date(`${detail.scheduled_for}T12:00:00`).toLocaleDateString(undefined,{dateStyle:'full'}) : dateTime(detail.scheduled_for)) : detail.slot || 'Contact the buyer for the pickup time'}</p>{detail.scheduled_for && detail.slot && <p className="mt-1 text-sm text-slate-600">{detail.slot}</p>}{enRoute && detail.eta_at && <p className="mt-2 text-sm">Arrival ETA: {dateTime(detail.eta_at)}</p>}</div></div>
        <div className="flex gap-3 p-5"><MapPin size={20} className="mt-0.5 shrink-0 text-brand-600"/><div><p className="font-semibold">{detail.pickup_address || 'Contact the buyer for the address'}</p><p className="mt-1 text-sm text-slate-500">{detail.seller.name || 'Seller'}</p>{detail.seller.phone && <a className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold" href={`tel:${detail.seller.phone}`} referrerPolicy="no-referrer"><Phone size={15}/>Call seller</a>}</div></div>
        {detail.offer_cents!=null && <div className="flex items-center justify-between bg-slate-50 px-5 py-4"><span className="text-sm text-slate-500">Seller payout</span><span className="text-xl font-semibold">${(detail.offer_cents/100).toFixed(2)}</span></div>}
      </section>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
      {closed ? <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">{completed?'Collection is recorded':'This pickup is closed'}</h2><p className="mt-2 text-sm text-slate-600">{completed?'The buyer’s office can see the pickup record, photos and seller signature.':'Ask the buyer for an updated assignment.'}</p>{detail.completed_at && <p className="mt-2 text-xs text-slate-500">{dateTime(detail.completed_at)}</p>}</section> : <>
        <Step number="01" title="Who’s collecting?">
          <label className="text-sm font-medium">Your name<input className={inputClass} value={driver} onChange={e=>setDriver(e.target.value)} autoComplete="name" maxLength={120} placeholder="First and last name"/></label>
          <p className="mt-2 text-xs text-slate-500">Your name is recorded with each pickup update.</p>
        </Step>
        <Step number="02" title="Keep the seller updated">
          {enRoute?<div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-800"><Check size={18}/>Departure recorded</div>:<div className="space-y-4"><label className="block text-sm font-medium">ETA in minutes<input className={inputClass} type="number" min={1} max={240} step={1} value={eta} onChange={e=>setEta(e.target.value)}/></label><button className={actionClass} disabled={!identified || !!busy || !Number.isInteger(Number(eta)) || Number(eta)<1 || Number(eta)>240} onClick={()=>void run('start',()=>api.start(driver.trim(),Number(eta)),'Departure saved. The seller’s arrival update has been requested.')}><Truck size={20}/>{busy==='start'?'Sending…':"I'm on my way"}</button></div>}
          <button className={`${actionClass} mt-3 !bg-white !text-slate-950 ring-1 ring-slate-300 disabled:!text-slate-400`} disabled={!identified || !!busy || !enRoute || !!detail.thirty_minutes_sent_at} onClick={()=>void run('thirty',()=>api.thirtyMinutes(driver.trim()),'30-minute update requested.')}><Clock size={19}/>{detail.thirty_minutes_sent_at?'30-minute notice sent':busy==='thirty'?'Sending…':"I'm 30 minutes away"}</button>
        </Step>
        <Step number="03" title="Document the pickup">
          <p className="mb-4 text-sm leading-relaxed text-slate-600">Photograph the vehicle and documents at pickup. Seller ID photos stay private to this pickup and the buyer’s office.</p>
          <div className="grid grid-cols-2 gap-3">{kinds.map(([kind,label])=><label key={kind} className={`flex min-h-20 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold ${!identified || busy?'opacity-50':''}`}><Camera size={20} className="shrink-0 text-slate-500"/><span>{busy===kind?'Uploading…':label}</span><input type="file" accept="image/*" capture="environment" className="sr-only" aria-label={`Upload ${label}`} disabled={!identified || !!busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void run(kind,()=>api.upload(driver.trim(),kind,file),`${label} photo saved.`);}}/></label>)}</div>
        </Step>
        <Step number="04" title="Seller signature">
          {detail.seller_signature?<div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="flex items-center gap-2 font-semibold text-emerald-900"><Check size={18}/>Signed by {detail.seller_signature.signer_name || 'seller'}</p><p className="mt-1 text-xs text-emerald-800">{dateTime(detail.seller_signature.signed_at)}</p></div>:<div className="space-y-4"><p className="text-sm leading-relaxed text-slate-600">Hand the phone to the seller to review the pickup details and sign the bill of sale.</p><label className="block text-sm font-medium">Seller’s printed name<input className={inputClass} value={sellerName} onChange={e=>setSellerName(e.target.value)} maxLength={120}/></label><div className="overflow-hidden rounded-xl border border-slate-300 bg-white"><SignaturePad onChange={setSignature} disabled={!identified || !!busy}/></div><button className={actionClass} disabled={!identified || !!busy || !signature || !sellerName.trim()} onClick={()=>void run('signature',()=>api.signature(driver.trim(),sellerName.trim(),signature!),'Seller signature saved.')}><ChevronRight size={20}/>{busy==='signature'?'Saving…':'Save seller signature'}</button></div>}
        </Step>
        <Step number="05" title="Finish pickup">
          <p className="mb-4 text-sm leading-relaxed text-slate-600">Complete this step after collecting the vehicle. This records collection and processes the buyer’s finder fee under their account agreement.</p>
          <label className="mb-4 flex min-h-12 items-center gap-3 text-sm font-medium"><input type="checkbox" className="h-5 w-5 accent-slate-950" checked={collected} onChange={e=>setCollected(e.target.checked)}/>The vehicle has been collected.</label>
          {!detail.seller_signature && <p className="mb-3 text-sm text-amber-800">Save the seller’s signature before completing pickup.</p>}
          <button className={`${actionClass} !bg-brand-600 hover:!bg-brand-700 disabled:!bg-slate-200`} disabled={!identified || !!busy || !detail.seller_signature || !collected} onClick={()=>void run('complete',()=>api.complete(driver.trim()),'Pickup completed. The buyer’s office has the record.')}><Check size={21}/>{busy==='complete'?'Completing…':'Pickup complete'}</button>
        </Step>
      </>}
      {!!detail.photos.length && <Step number="↳" title={`Saved photos · ${detail.photos.length}`}><div className="grid grid-cols-2 gap-3">{detail.photos.map(photo=><PrivatePhoto key={photo.id} id={photo.id} label={photo.photo_kind==='id_document'?'seller ID · private':photo.photo_kind.replace(/_/g,' ')} load={api.photo}/>)}</div></Step>}
      <footer className="mt-6 flex gap-2 border-t border-slate-200 pt-5 text-xs leading-relaxed text-slate-500"><ShieldCheck size={16} className="shrink-0"/><p>This link gives access to this pickup only. Share it only with the person collecting the vehicle.{detail.expires_at && ` Expires ${dateTime(detail.expires_at)}.`}</p></footer>
    </div>
  </main>;
}
