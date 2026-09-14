const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";
export type PickupAccessDetail = {
  pickup_order_id: number; status: string;
  vehicle: {year: number|null;make:string|null;model:string|null;vin:string|null;condition:string|null};
  seller: {name:string|null;phone:string|null;email:string|null};
  pickup_address:string|null; slot:string|null; scheduled_for?:string|null; eta_at:string|null;
  offer_cents:number|null; expires_at?:string|null; thirty_minutes_sent_at?:string|null;
  photos:Array<{id:number;photo_kind:string;url?:string}>;
  seller_signature:{signer_name:string|null;signed_at:string}|null;
  completed_at:string|null;
};
export class PickupAccessError extends Error {
  constructor(message:string, public status:number) {super(message);}
}
export function createPickupAccessApi(token:string) {
  async function request(path:string,init:RequestInit={}) {
    const response=await fetch(`${BASE}/api/pickup-access${path}`,{
      ...init,cache:"no-store",referrerPolicy:"no-referrer",credentials:"omit",
      headers:{...(init.body instanceof FormData ? {} : {"Content-Type":"application/json"}),...init.headers,Authorization:`Bearer ${token}`},
    });
    if(!response.ok){
      const body=await response.json().catch(()=>({}));
      throw new PickupAccessError(response.status===401 || response.status===403
        ? "This pickup link is unavailable or has expired. Ask the buyer for a new link."
        : body.error || "Could not save this step. Please try again.",response.status);
    }
    return response;
  }
  const post=(path:string,body:Record<string,unknown>)=>request(path,{method:"POST",body:JSON.stringify(body)}).then(r=>r.json());
  return {
    detail:()=>request('/detail').then(r=>r.json()) as Promise<PickupAccessDetail>,
    start:(driverName:string,etaMinutes:number)=>post('/start',{driver_name:driverName,eta_minutes:etaMinutes}),
    thirtyMinutes:(driverName:string)=>post('/thirty-minutes',{driver_name:driverName}),
    arrive:(driverName:string)=>post('/arrive',{driver_name:driverName}),
    complete:(driverName:string)=>post('/complete',{driver_name:driverName}),
    signature:(driverName:string,signerName:string,signature:string)=>post('/signature',{driver_name:driverName,signer_name:signerName,signature}),
    upload:(driverName:string,kind:string,file:File)=>{
      const data=new FormData();data.append('driver_name',driverName);data.append('photo_kind',kind);data.append('file',file);
      return request('/photos',{method:'POST',body:data}).then(r=>r.json());
    },
    photo:(id:number)=>request(`/photos/${id}/raw`).then(r=>r.blob()),
  };
}
export type PickupAccessApi=ReturnType<typeof createPickupAccessApi>;
