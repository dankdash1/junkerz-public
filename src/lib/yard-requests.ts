const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";
const YARD_BASE = `${BASE}/api/junkyard-public`;

export type YardRequestKind = "donor_part" | "part" | "whole_car";

export type YardRequestBody = {
  idempotency_key: string;
  kind: YardRequestKind;
  car_id?: number;
  part_id?: number;
  component?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  target_vehicle?: string;
  message?: string;
};

export type YardRequestAttempt = Readonly<{
  body: Readonly<YardRequestBody>;
  serializedBody: string;
}>;

export type YardRequestReceipt = {
  request: { id?: string; reference: string; status: string; vehicle_label?: string; component?: string; created_at?: string };
  status_url: string;
  message: string;
};

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error((data as { error?: string }).error || `Request failed (${response.status})`), { status: response.status });
  return data;
}

export function createYardRequestAttempt(body: Omit<YardRequestBody, "idempotency_key">): YardRequestAttempt {
  const withKey = Object.freeze({ idempotency_key: crypto.randomUUID(), ...body });
  return Object.freeze({ body: withKey, serializedBody: JSON.stringify(withKey) });
}

export async function submitYardRequest(attempt: YardRequestAttempt, fetchImpl: typeof fetch = fetch): Promise<YardRequestReceipt> {
  let response: Response;
  try {
    response = await fetchImpl(`${YARD_BASE}/yard-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: attempt.serializedBody,
    });
  } catch (error) {
    throw Object.assign(error instanceof Error ? error : new Error("Connection interrupted"), { ambiguous: true });
  }
  return readResponse(response) as Promise<YardRequestReceipt>;
}

export async function getYardRequestSettings(fetchImpl: typeof fetch = fetch): Promise<{ enabled: boolean }> {
  const data = await readResponse(await fetchImpl(`${YARD_BASE}/yard-request-settings`, { cache: "no-store" }));
  if (!data || typeof (data as { enabled?: unknown }).enabled !== "boolean") throw new Error("Invalid request settings response");
  return { enabled: (data as { enabled: boolean }).enabled };
}

export function tokenFromFragment(hash: string): string {
  if (!hash.startsWith("#")) return "";
  const value = new URLSearchParams(hash.replace(/^#/, "")).get("token") || "";
  return value.trim();
}

export async function loadCustomerRequest(token: string, fetchImpl: typeof fetch = fetch) {
  return readResponse(await fetchImpl(`${YARD_BASE}/yard-requests/status`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ token }),
  }));
}

export async function createYardPaymentSession(token: string, fetchImpl: typeof fetch = fetch): Promise<{ url: string }> {
  const data = await readResponse(await fetchImpl(`${YARD_BASE}/yard-requests/payment-session`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ token }),
  })) as { url?: unknown };
  if (typeof data.url !== "string" || !data.url.startsWith("https://")) throw new Error("Invalid payment session response");
  return { url: data.url };
}

export async function loadSupplierRequest(token: string, fetchImpl: typeof fetch = fetch) {
  return readResponse(await fetchImpl(`${YARD_BASE}/yard-requests/supplier-view`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ token }),
  }));
}

export async function replyToSupplierRequest(token: string, reply: Record<string, unknown>, fetchImpl: typeof fetch = fetch) {
  return readResponse(await fetchImpl(`${YARD_BASE}/yard-requests/supplier-reply`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ token, ...reply }),
  }));
}

export type YardQuote = {
  id: string; request_id: string; version: number; status: string; part_id?: number|null; car_id?: number|null; quantity: number;
  item_price_cents: number; delivery_cents: number; tax_cents: number; fees_cents: number; total_cents: number; currency: string;
  condition: string; fitment: string; delivery_address: Record<string,string>; delivery_terms: string; return_terms: string; core_terms: string; expires_at: string; order_id?: string|null;
};
export type QuoteResult = {quote: YardQuote|null; order_id?: string|null};
export async function loadCustomerQuote(token:string):Promise<QuoteResult> {
  return readResponse(await fetch(`${YARD_BASE}/yard-requests/quote`,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({token})}));
}
export async function respondCustomerQuote(token:string,quote:YardQuote,decision:'accept'|'decline',idempotency_key:string):Promise<QuoteResult> {
  return readResponse(await fetch(`${YARD_BASE}/yard-requests/quote/respond`,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({token,quote_id:quote.id,version:quote.version,decision,idempotency_key})}));
}

export type Preparation={id:string;order_id:string;revision:number;status:string;snapshot:Record<string,string|number>;collected_at?:string};
export async function updatePreparation(token:string,item:Preparation,action:string,details:Record<string,unknown>){
 return readResponse(await fetch(`${YARD_BASE}/yard-requests/preparation`,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({token,preparation_id:item.id,expected_revision:item.revision,action,details})}));
}
