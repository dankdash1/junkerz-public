import type { YardRequestBody, YardRequestReceipt } from './yard-requests';
export type CustomerProfile={id:string;normalized_email:string;name:string;phone:string;delivery_address:Record<string,string>;pending_request?:YardRequestBody|null};
export type CustomerRequest={id:string;reference:string;status:string;vehicle_label:string;component:string;customer_message:string;order_id?:string;payment_status?:string;payment_available?:boolean;order_status?:string;total?:string;receipt_available?:boolean;customer_name?:string;customer_email?:string;customer_phone?:string;
  // Newer backends only; absent or null means not chosen yet.
  fulfillment_method?:string|null;part_side?:string|null;delivery_address?:Record<string,string>|null;
  // Deposit quotes only (backend #3690); absent means the one-payment button applies.
  deposit?:DepositState|null};
/** Deposit then balance on an approved quote. All amounts are server-computed cents. */
export type DepositState={deposit_mode:true;test_mode:boolean;online_payments_on:boolean;
  total_cents:number;tax_cents:number;deposit_cents:number;deposit_tax_cents:number;balance_cents:number;balance_tax_cents:number;
  deposit_basis_points:number;hold_days:number|null;deposit_refundable:boolean|null;accepted_at:string|null;hold_until:string|null;hold_ended:boolean;
  deposit_status:'due'|'pending'|'paid';deposit_paid_at:string|null;balance_status:'due'|'pending'|'paid';balance_paid_at:string|null;
  balance_paid_how:'online'|'pickup_code'|'cash'|null;balance_methods:string[];quote_expires_at:string;
  deposit_payment_available:boolean;balance_online_available:boolean;amount_due_cents:number;
  agreement?:{version:string;text:string;sha256:string};agreed_version?:string|null;pickup_code?:string|null};
export type TaxExemption={status:'none'|'submitted'|'verified'|'rejected'|string;exempt:boolean;certificate_on_file:boolean;certificate_required:string;tax_permit_number?:string|null;tax_permit_state?:string|null;tax_certificate_id?:string|null;tax_exempt_submitted_at?:string|null;tax_exempt_verified_at?:string|null;tax_exempt_rejected_at?:string|null};
export async function customerFetch<T>(path:string,init:RequestInit={}):Promise<T> {
 const response=await fetch(`/api/customer/${path}`,{...init,credentials:'same-origin',cache:'no-store',headers:{...(init.body && !(init.body instanceof FormData) ? {'Content-Type':'application/json'} : {}),...init.headers}});
 const data=await response.json().catch(()=>({}));
 if(!response.ok) throw Object.assign(new Error(data.error || 'Could not load My Junkerz'),{status:response.status});
 return data as T;
}
export const getCustomer=()=>customerFetch<CustomerProfile>('me');
export const sendCustomerLink=(email:string,claim_context?:{request?:YardRequestBody;capability?:string})=>customerFetch<{accepted:boolean}>('sign-in-link',{method:'POST',body:JSON.stringify({email,claim_context})});
export const submitCustomerRequest=(body:YardRequestBody)=>customerFetch<YardRequestReceipt>('requests',{method:'POST',body:JSON.stringify(body)});
