import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
function backendOrigin() {
 const local=process.env.JUNKERZ_CUSTOMER_API_BASE;
 if(local && (process.env.NODE_ENV==='development' || process.env.NODE_ENV==='test')) {
   const url=new URL(local);
   if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname) || !['http:','https:'].includes(url.protocol) || url.username || url.password || url.pathname!=='/' || url.search || url.hash) throw new Error('Customer test backend must be a loopback origin');
   return url.origin;
 }
 return 'https://api.dankdash.ai';
}
const BACKEND = `${backendOrigin()}/api/junkyard-public/customer`;
const COOKIE = '__Host-junkerz_customer';
const BROWSER = '__Host-junkerz_browser';
const uuid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
const rules: Record<string, RegExp[]> = {
 GET: [/^settings$/, /^me$/, /^requests$/, /^orders$/, new RegExp(`^requests/${uuid}$`), new RegExp(`^requests/${uuid}/(messages|quote)$`), new RegExp(`^requests/${uuid}/attachments/${uuid}$`), /^orders\/[A-Za-z0-9_-]{1,80}(\/receipt)?$/],
 POST: [/^sign-in-link$/, /^verify$/, /^logout$/, /^claim-request$/, /^requests$/, new RegExp(`^requests/${uuid}/(messages|attachments|quote/respond|payment-session)$`)],
 PATCH: [/^me$/],
};
function json(data: unknown, status=200) { return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}}); }
async function proxy(request:NextRequest,context:{params:{path:string[]}}) {
 const path=context.params.path.join('/');
 if (!rules[request.method]?.some(rule=>rule.test(path))) return json({error:'Not found'},404);
 if (request.method!=='GET') {
   const origin=request.headers.get('origin');
   const expected=process.env.NODE_ENV==='development' ? request.nextUrl.origin : 'https://www.junkerz.com';
   if (origin!==expected || request.headers.get('sec-fetch-site')==='cross-site') return json({error:'Invalid request origin'},403);
 }
 const browser=request.cookies.get(BROWSER)?.value || crypto.randomUUID();
 const session=request.cookies.get(COOKIE)?.value;
 const headers:Record<string,string>={'X-Junkerz-Browser':browser};
 if(session) headers.Authorization=`Bearer ${session}`;
 let body: ArrayBuffer | undefined;
 if(request.method!=='GET') {
   const max=path.endsWith('/attachments') ? 10*1024*1024+16384 : 16384;
   if(Number(request.headers.get('content-length'))>max) return json({error:'Request is too large'},413);
   body=await request.arrayBuffer();
   if(body.byteLength>max) return json({error:'Request is too large'},413);
   headers['Content-Type']=request.headers.get('content-type') || 'application/json';
 }
 // Only the documented cursor can be forwarded, never arbitrary query destinations or tokens.
 const after=request.nextUrl.searchParams.get('after_id');
 const suffix=path.endsWith('/messages') && request.method==='GET' && after ? `?after_id=${encodeURIComponent(after)}` : '';
 try {
   const upstream=await fetch(`${BACKEND}/${path}${suffix}`,{method:request.method,headers,body,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});
   const contentType=upstream.headers.get('content-type') || '';
   let result:NextResponse;
   if(upstream.ok && (path.endsWith('/receipt') || /\/attachments\//.test(path))) {
     result=new NextResponse(await upstream.arrayBuffer(),{status:upstream.status,headers:{'Content-Type':contentType,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"}});
     const disposition=upstream.headers.get('content-disposition'); if(disposition) result.headers.set('Content-Disposition',disposition);
   } else {
     const data=await upstream.json().catch(()=>({error:'Customer service is temporarily unavailable'}));
     if(path==='verify' && upstream.ok) {
       if(typeof data.session!=='string' || data.session.length<32 || data.session.length>128) return json({error:'Could not confirm sign-in'},502);
       result=json({success:true});
       result.cookies.set(COOKIE,data.session,{secure:true,httpOnly:true,sameSite:'lax',path:'/',maxAge:604800});
     } else {
       delete data.session;delete data.challenge;delete data.token;
       result=json(data,upstream.status);
     }
   }
   if((path==='logout' && upstream.ok) || upstream.status===401) result.cookies.set(COOKIE,'',{secure:true,httpOnly:true,sameSite:'lax',path:'/',maxAge:0});
   if(!request.cookies.get(BROWSER)) result.cookies.set(BROWSER,browser,{secure:true,httpOnly:true,sameSite:'lax',path:'/',maxAge:604800});
   return result;
 } catch { return json({error:'Connection interrupted. Please try again.'},503); }
}
export const GET=proxy;
export const POST=proxy;
export const PATCH=proxy;
