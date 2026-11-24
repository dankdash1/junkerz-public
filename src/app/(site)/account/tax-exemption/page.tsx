'use client';
import {useCallback,useEffect,useState} from 'react';
import {customerFetch,TaxExemption} from '@/lib/customer-api';
import CustomerAccountState from '@/components/CustomerAccountState';

// Texas needs a completed resale certificate (Form 01-339) on file; a permit number alone is not enough.
// The backend refuses anything else, and staff verify each certificate before any quote drops the tax.
const STATES='AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const MAX_BYTES=10*1024*1024;
const ACCEPT='application/pdf,image/jpeg,image/png,image/webp';

const STATUS:Record<string,{label:string;text:string;tone:string}>={
 none:{label:'No exemption on file',text:'Sales tax is added to your quotes.',tone:'border-zinc-200'},
 submitted:{label:'Waiting for Junkerz to check it',text:'We received your certificate. Sales tax stays on your quotes until staff verify it.',tone:'border-amber-300 bg-amber-50'},
 verified:{label:'Verified — tax exempt',text:'New quotes will not add sales tax.',tone:'border-green-300 bg-green-50'},
 rejected:{label:'Not accepted',text:'Staff could not accept this certificate. Upload a new completed Form 01-339 to try again.',tone:'border-red-300 bg-red-50'},
};

export default function TaxExemptionPage(){
 const [data,setData]=useState<TaxExemption|null>(null);const [error,setError]=useState('');const [loadError,setLoadError]=useState('');const [busy,setBusy]=useState(false);const [saved,setSaved]=useState(false);
 const load=useCallback(async()=>{try{setData((await customerFetch<{tax_exemption:TaxExemption}>('tax-exemption')).tax_exemption);setLoadError('');}catch(e){setLoadError((e as Error).message);}},[]);
 useEffect(()=>{void load();},[load]);
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;setError('');setSaved(false);
  const formEl=event.currentTarget;const form=new FormData(formEl);const file=form.get('file');
  const hasFile=file instanceof File && file.size>0;
  if(!hasFile) form.delete('file');
  if(!hasFile && !data?.certificate_on_file){setError('Attach the completed Texas resale certificate (Form 01-339). A permit number alone is not enough.');return;}
  if(hasFile && (file as File).size>MAX_BYTES){setError('The certificate must be at most 10 MB.');return;}
  setBusy(true);
  try{setData((await customerFetch<{tax_exemption:TaxExemption}>('tax-exemption',{method:'POST',body:form})).tax_exemption);setSaved(true);formEl.reset();}
  catch(e){if((e as {status?:number}).status===401)setData(null);setError((e as Error).message);}
  finally{setBusy(false);}
 }
 if(!data&&loadError)return <CustomerAccountState error={loadError} retry={load}/>;
 if(!data)return <p role="status">Loading tax exemption…</p>;
 const status=STATUS[data.status]||STATUS.none;
 return <>
  <h1 className="text-3xl font-bold">Sales tax exemption</h1>
  <p className="mt-3 max-w-2xl">If you buy parts to resell, upload your completed <strong>Texas resale certificate (Form 01-339)</strong> and your sales tax permit number. A permit number alone is not enough. Junkerz staff check every certificate before quotes stop adding tax.</p>
  <section aria-label="Exemption status" className={`mt-7 max-w-xl rounded-xl border p-5 ${status.tone}`}>
   <p className="font-bold">{status.label}</p><p className="mt-1">{status.text}</p>
   {data.tax_permit_number&&<p className="mt-3 text-sm">Permit: <strong>{data.tax_permit_number}</strong> ({data.tax_permit_state})</p>}
   {data.certificate_on_file&&<p className="mt-1 text-sm"><a className="underline" href="/api/customer/tax-exemption/certificate">Download the certificate on file</a></p>}
  </section>
  <form onSubmit={submit} className="mt-7 max-w-xl space-y-4 rounded-xl border bg-white p-6">
   <h2 className="text-xl font-bold">{data.certificate_on_file?'Replace or update':'Upload your certificate'}</h2>
   <label className="block font-medium">Sales tax permit number<input name="permit_number" required defaultValue={data.tax_permit_number||''} maxLength={40} pattern="[A-Za-z0-9][A-Za-z0-9 \-]{2,38}[A-Za-z0-9]" title="Letters, digits, spaces or dashes" className="mt-1 min-h-11 w-full rounded-lg border px-3 uppercase"/></label>
   <label className="block font-medium">State that issued the permit<select name="state" required defaultValue={data.tax_permit_state||'TX'} className="mt-1 min-h-11 w-full rounded-lg border bg-white px-3">{STATES.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
   <label className="block font-medium">Completed Form 01-339 (PDF or photo, up to 10 MB){data.certificate_on_file&&<span className="font-normal text-zinc-600"> — optional; leave empty to keep the one on file</span>}<input name="file" type="file" accept={ACCEPT} required={!data.certificate_on_file} className="mt-1 block w-full"/></label>
   <p className="text-sm text-zinc-600">Any change sends the exemption back to staff to check again. Until it is verified, sales tax stays on your quotes.</p>
   {error&&<p role="alert" className="text-red-700">{error}</p>}
   {saved&&<p role="status">Certificate received. Staff will check it.</p>}
   <button disabled={busy} className="min-h-12 rounded-lg bg-brand-700 px-5 font-bold text-white">{busy?'Uploading…':'Send for review'}</button>
  </form>
 </>;
}
