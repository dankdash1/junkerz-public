import type { YardRequestBody, YardRequestReceipt } from './yard-requests';
export type CustomerProfile={id:string;normalized_email:string;name:string;phone:string;delivery_address:Record<string,string>;pending_request?:YardRequestBody|null};
export type CustomerRequest={id:string;reference:string;status:string;vehicle_label:string;component:string;customer_message:string;order_id?:string;payment_status?:string;payment_available?:boolean;order_status?:string;total?:string;receipt_available?:boolean;customer_name?:string;customer_email?:string;customer_phone?:string};
export async function customerFetch<T>(path:string,init:RequestInit={}):Promise<T> {
 const response=await fetch(`/api/customer/${path}`,{...init,credentials:'same-origin',cache:'no-store',headers:{...(init.body && !(init.body instanceof FormData) ? {'Content-Type':'application/json'} : {}),...init.headers}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok) throw Object.assign(new Error(data.error || 'Could not load My Junkerz'),{status:response.status});
 return data as T;
}
export const getCustomer=()=>customerFetch<CustomerProfile>('me');
export const sendCustomerLink=(email:string,claim_context?:{request?:YardRequestBody;capability?:string})=>customerFetch<{accepted:boolean}>('sign-in-link',{method:'POST',body:JSON.stringify({email,claim_context})});
export const submitCustomerRequest=(body:YardRequestBody)=>customerFetch<YardRequestReceipt>('requests',{method:'POST',body:JSON.stringify(body)});
