'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageCircle, Paperclip, RefreshCw, Send } from 'lucide-react';
import { conversationAPI, savePrivatePhoto, type ConversationScope, type MessageAttempt, type RequestMessage, type RequestPhoto } from '@/lib/yardConversationApi';

export default function YardRequestConversation(props: ConversationScope) {
  return <Conversation key={props.requestId || `${props.audience || 'customer'}:${props.token || ''}`} {...props}/>;
}

function Conversation({requestId,token,audience='customer'}: ConversationScope) {
  const api=useMemo(()=>conversationAPI({requestId,token,audience}),[requestId,token,audience]);
  const [messages,setMessages]=useState<RequestMessage[]>([]);
  const [draft,setDraft]=useState('');const [photos,setPhotos]=useState<RequestPhoto[]>([]);
  const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [uploading,setUploading]=useState(false);
  const [error,setError]=useState('');const [expired,setExpired]=useState(false);const [failed,setFailed]=useState(false);
  const [updates,setUpdates]=useState(0);const [notice,setNotice]=useState('');
  const cursor=useRef(0);const loaded=useRef(false);const inFlight=useRef(false);const savingRef=useRef(false);
  const attempt=useRef<MessageAttempt|null>(null);const controller=useRef<AbortController|null>(null);
  const mounted=useRef(true);const uploadAttempts=useRef(new WeakMap<File,string>());
  const fail=useCallback((reason: unknown)=>{
    if (!mounted.current || (reason as Error).name==='AbortError') return;
    setError((reason as Error).message || 'Messages are temporarily unavailable.');
    if ((reason as {status?:number}).status===401) setExpired(true);
  },[]);
  const merge=useCallback((incoming:RequestMessage[],advance=true)=>{
    setMessages(current=>Array.from(new Map([...current,...incoming].map(m=>[m.id,m])).values()).sort((a,b)=>a.id-b.id));
    if (advance && incoming.length) cursor.current=Math.max(cursor.current,...incoming.map(m=>m.id));
  },[]);
  const refresh=useCallback(async()=>{
    if (inFlight.current || expired || document.visibilityState==='hidden') return;
    inFlight.current=true;const abort=new AbortController();controller.current=abort;
    try {
      let after=cursor.current;let count=0;
      do {
        const page=await api.list(after || undefined,abort.signal);
        if (abort.signal.aborted) return;
        const fresh=page.messages.filter(m=>m.id>cursor.current);count+=fresh.length;merge(page.messages);
        if (!page.next_cursor || page.next_cursor<=after) break;
        after=page.next_cursor;
      } while (!abort.signal.aborted);
      if (loaded.current && count) setUpdates(current=>current+count);
      loaded.current=true;
    } catch(reason) { fail(reason); }
    finally { if (controller.current===abort) {inFlight.current=false;if(mounted.current)setLoading(false);} }
  },[api,expired,fail,merge]);
  useEffect(()=>{
    mounted.current=true;refresh();let timer:ReturnType<typeof setInterval>|null=null;
    const visible=()=>{if(timer)clearInterval(timer);timer=null;if(document.visibilityState!=='hidden'){refresh();timer=setInterval(refresh,15000);}else{controller.current?.abort();inFlight.current=false;}};
    visible();window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',visible);
    return()=>{mounted.current=false;controller.current?.abort();inFlight.current=false;if(timer)clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',visible);};
  },[refresh]);
  const send=async(event:React.FormEvent)=>{
    event.preventDefault();if(savingRef.current||uploading||expired||(!draft.trim()&&!photos.length))return;
    savingRef.current=true;setSaving(true);setError('');setNotice('');
    const ids=photos.map(photo=>photo.id);
    if(!attempt.current||attempt.current.text!==draft.trim()||JSON.stringify(attempt.current.attachment_ids)!==JSON.stringify(ids)) attempt.current={text:draft.trim(),attachment_ids:ids,idempotency_key:crypto.randomUUID()};
    try {const message=await api.send(attempt.current);if(!mounted.current)return;merge([message],false);setDraft('');setPhotos([]);attempt.current=null;setFailed(false);setNotice('Message saved. Junkerz can see your reply.');}
    catch(reason){fail(reason);if(mounted.current)setFailed(true);}
    finally{savingRef.current=false;if(mounted.current)setSaving(false);}
  };
  const upload=async(files:FileList|null)=>{
    if(!files?.length||uploading||saving)return;
    if(photos.length+files.length>5){setError('Attach up to five photos to one message.');return;}
    setUploading(true);setError('');
    try{for(const file of Array.from(files)){let id=uploadAttempts.current.get(file);if(!id){id=crypto.randomUUID();uploadAttempts.current.set(file,id);}const photo=await api.upload(file,id);if(!mounted.current)return;setPhotos(current=>current.some(p=>p.id===photo.id)?current:[...current,photo]);}}
    catch(reason){fail(reason);}finally{if(mounted.current)setUploading(false);}
  };
  const download=async(photo:RequestPhoto)=>{try{await savePrivatePhoto(await api.download(photo.id),photo);}catch(reason){fail(reason);}};
  return <section aria-label="Conversation with Junkerz" className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
    <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-5 py-4"><div><h2 className="flex items-center gap-2 font-bold"><MessageCircle className="h-5 w-5 text-brand-700"/>Messages with Junkerz</h2><p className="mt-1 text-xs text-zinc-500">{audience==='supplier'?'Private yard conversation':'Your private request conversation'}</p></div><button type="button" aria-label="Refresh messages" onClick={()=>{setError('');refresh();}} className="min-h-11 rounded-lg px-3 hover:bg-zinc-200"><RefreshCw className="h-4 w-4"/></button></div>
    <div aria-live="polite" className="px-5 pt-3 text-xs text-brand-700">{updates>0&&`${updates} new ${updates===1?'message':'messages'}`}</div>
    <ol aria-label="Messages" className="max-h-[28rem] space-y-4 overflow-y-auto p-5">{loading&&<li className="flex items-center gap-2 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin"/>Loading messages…</li>}{!loading&&!messages.length&&<li className="py-5 text-center text-sm text-zinc-500">No messages yet.</li>}{messages.map(message=><li key={message.id} className={`rounded-xl p-4 ${message.actor_role==='staff'?'border border-zinc-200 bg-zinc-50':'ml-5 bg-brand-50'}`}><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500"><strong className="text-zinc-800">{message.actor_role==='staff'?'Junkerz':'You'}</strong><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time></div><p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.text}</p>{message.attachments?.map((photo,index)=><button key={photo.id} type="button" onClick={()=>download(photo)} className="mt-3 mr-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 text-sm font-semibold"><Paperclip className="h-4 w-4"/>Download photo {index+1}</button>)}</li>)}</ol>
    {error&&<div role="alert" className="mx-5 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}{expired&&<a href={`/account/sign-in${requestId?`?next=${encodeURIComponent(`/account/requests/${requestId}`)}`:''}`} className="mt-2 block font-bold underline">Sign in to continue</a>}{!expired&&(error.toLowerCase().includes('expired')||error.toLowerCase().includes('invalid'))&&<a href="/contact-us" className="mt-2 block underline">Ask Junkerz for a fresh request link</a>}</div>}
    <form onSubmit={send} className="space-y-3 border-t border-zinc-200 bg-zinc-50 p-5"><label className="block text-sm font-bold">Message to Junkerz<textarea value={draft} onChange={event=>{setDraft(event.target.value);setFailed(false);}} disabled={saving||expired} maxLength={10000} rows={3} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 font-normal focus:outline-none focus:ring-2 focus:ring-brand-600" placeholder="Ask a question or share a part detail…"/></label>
    {photos.length>0&&<ul className="space-y-1 text-sm">{photos.map((photo,index)=><li key={photo.id} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2"><span>Photo {index+1} · {Math.ceil(photo.size_bytes/1024)} KB uploaded</span><button type="button" disabled={saving} onClick={()=>setPhotos(current=>current.filter(p=>p.id!==photo.id))} className="min-h-10 px-2 underline">Remove</button></li>)}</ul>}
    <div className="flex flex-wrap items-center justify-between gap-3"><label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold"><Paperclip className="h-4 w-4"/>{uploading?'Uploading…':'Attach photos'}<input aria-label="Attach photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={saving||uploading||expired} onChange={event=>upload(event.target.files)} className="sr-only"/></label><button type="submit" disabled={saving||uploading||expired||(!draft.trim()&&!photos.length)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white disabled:opacity-50">{saving?<Loader2 className="h-4 w-4 animate-spin"/>:<Send className="h-4 w-4"/>}{saving?'Sending…':failed?'Retry message':'Send message'}</button></div><p className="text-xs text-zinc-500">Up to 5 photos, 10 MB each. JPEG, PNG or WebP.</p>{notice&&<p role="status" className="text-sm text-green-800">{notice}</p>}</form>
  </section>;
}
