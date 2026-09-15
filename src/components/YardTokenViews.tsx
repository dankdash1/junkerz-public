"use client";
import YardPreparationPanel from './YardPreparationPanel';
import YardRequestQuote from './YardRequestQuote';
import ClaimCustomerRequest from './ClaimCustomerRequest';
import {loadCustomerQuote,respondCustomerQuote} from '@/lib/yard-requests';

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, PackageCheck, TriangleAlert } from "lucide-react";
import YardRequestConversation from "@/components/YardRequestConversation";
import { Button } from "@/components/ui/button";
import { createYardPaymentSession, loadCustomerRequest, loadSupplierRequest, replyToSupplierRequest, tokenFromFragment } from "@/lib/yard-requests";

type CustomerProjection = { request: { reference: string; status: string; vehicle_label?: string; component?: string; customer_message?: string; updated_at?: string; order_id?: string | number; order_status?: string; payment_status?: string; payment_available?: boolean; retail_price_cents?: number; preparation?: {status:string}; refund_state?:string;refunded_cents?:number;payment_exception?:boolean } };
type SupplierProjection = { request: { reference: string; status: string; revision: number; vehicle_label?: string; component?: string; target_vehicle?: string; part_number?: string; condition?: string; pickup_window?: string; supplier_notes?: string; supplier_price_cents?: number; car_id?: number; part_id?: number; vin?: string; yard_location?: string; preparation?:import('@/lib/yard-requests').Preparation } };

const pretty = (value?: string) => (value || "Received").replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
const money = (cents?: number) => typeof cents === "number" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100) : "Not provided";
const orderBanner = (paymentStatus?: string, orderStatus?: string) => {
  if (paymentStatus === "paid" && ["delivered", "completed"].includes(orderStatus || "")) return "Payment confirmed. Delivery completed.";
  if (paymentStatus === "paid" && ["in_transit", "out_for_delivery"].includes(orderStatus || "")) return "Payment confirmed. Delivery is in progress.";
  if (paymentStatus === "paid") return "Payment confirmed. Junkerz will arrange delivery after supplier readiness is confirmed.";
  if (paymentStatus === "refunded") return "Payment refunded. Contact Junkerz if you need help with this order.";
  if (paymentStatus === "pending") return "An unpaid order has been prepared. Junkerz will confirm payment and delivery separately.";
  return "An order has been prepared. Check the latest update for its verified payment and delivery status.";
};

function TokenShell({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return <main className="min-h-screen bg-zinc-950 px-5 py-10 text-zinc-950 sm:py-16">
    <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30">
      <div className="h-2 bg-brand-600" />
      <div className="p-6 sm:p-10"><p className="font-[family-name:var(--font-geist-mono)] text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>{children}</div>
    </div>
  </main>;
}

export function CustomerRequestStatus({ loadStatus = loadCustomerRequest, startPayment = createYardPaymentSession, navigate = (url) => window.location.assign(url) }: {
  loadStatus?: (token: string) => Promise<unknown>;
  startPayment?: (token: string) => Promise<{ url: string }>;
  navigate?: (url: string) => void;
}) {
  const [data, setData] = useState<CustomerProjection | null>(null);
  const [error, setError] = useState("");
  const [paying, setPaying] = useState(false);
  const token = typeof window === "undefined" ? "" : tokenFromFragment(window.location.hash);
  useEffect(() => {
    if (!token) { setError("This request link is incomplete or expired."); return; }
    loadStatus(token).then((value) => setData(value as CustomerProjection)).catch((reason) => setError(reason.message || "Could not load this request."));
  }, [loadStatus, token]);
  const loadQuote=useCallback(()=>loadCustomerQuote(token),[token]);
  const quoteResponse=useCallback((quote:import('@/lib/yard-requests').YardQuote,decision:'accept'|'decline',key:string)=>respondCustomerQuote(token,quote,decision,key),[token]);
  const refreshStatus=()=>{loadStatus(token).then(value=>setData(value as CustomerProjection)).catch(reason=>setError(reason.message))};
  const pay = async () => {
    if (paying || !token) return;
    setPaying(true); setError("");
    try {
      const session = await startPayment(token);
      if (!session.url.startsWith("https://")) throw new Error("Invalid payment session response");
      navigate(session.url);
    } catch (reason) { setError((reason as Error).message || "Could not open secure payment."); setPaying(false); }
  };
  return <TokenShell eyebrow="Private request status">
    {!data && !error && <p role="status" className="mt-8 flex items-center gap-3 text-zinc-600"><Loader2 className="h-5 w-5 animate-spin" /> Checking request…</p>}
    {error && <p role="alert" className="mt-7 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</p>}
    {data && <>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-extrabold">{data.request.reference}</h1><p className="mt-2 text-zinc-600">{data.request.vehicle_label}{data.request.component ? ` · ${data.request.component}` : ""}</p></div><span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-950">{pretty(data.request.status)}</span></div>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-5"><div className="flex gap-3"><Clock3 className="mt-0.5 h-5 w-5 text-brand-600" /><div><h2 className="font-bold">Latest update</h2><p className="mt-2 leading-relaxed text-zinc-700">{data.request.customer_message || "We received your request and will update this page after the stock holder replies."}</p>{data.request.updated_at && <p className="mt-3 text-xs text-zinc-500">Updated {new Date(data.request.updated_at).toLocaleString()}</p>}</div></div></div>
      {data.request.order_id && !data.request.payment_exception && (!data.request.refund_state || data.request.refund_state==='none') && <p className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 p-4 text-sm font-semibold text-green-900"><CheckCircle2 className="h-5 w-5" /> {orderBanner(data.request.payment_status, data.request.order_status)}</p>}
      {data.request.preparation && <p className="mt-3 text-sm font-semibold">Preparation: {pretty(data.request.preparation.status)}</p>}
      {data.request.order_status && <p className="mt-3 text-center text-sm font-semibold text-zinc-700">Delivery status: {pretty(data.request.order_status)}</p>}
      {data.request.status === "ordered" && data.request.payment_available === true && <div className="mt-5">{typeof data.request.retail_price_cents === "number" && <p className="mb-3 text-center text-lg font-bold">Confirmed total: <span className="text-brand-700">{money(data.request.retail_price_cents)}</span></p>}<Button type="button" className="min-h-12 w-full" disabled={paying} onClick={pay}>{paying ? <><Loader2 className="animate-spin" /> Opening secure payment…</> : "Pay confirmed order"}</Button><p className="mt-2 text-xs text-zinc-500">Payment confirmation may take a moment. Refresh for the latest status.</p></div>}
      <ClaimCustomerRequest token={token}/>
      <YardRequestQuote loadQuote={loadQuote} respond={quoteResponse} paymentStatus={data.request.payment_status} onAccepted={refreshStatus} onQuestion={()=>document.querySelector<HTMLTextAreaElement>('textarea')?.focus()}/>
      <YardRequestConversation token={token} audience="customer" />
      {!data.request.order_id && <p className="mt-7 text-sm leading-relaxed text-zinc-500">Availability does not mean reserved, fitment-confirmed, paid, or ready for pickup.</p>}
    </>}
  </TokenShell>;
}

export function SupplierReplyPanel({ loadSupplier = loadSupplierRequest, reply = replyToSupplierRequest }: {
  loadSupplier?: (token: string) => Promise<unknown>;
  reply?: (token: string, body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [data, setData] = useState<SupplierProjection | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("available");
  const token = typeof window === "undefined" ? "" : tokenFromFragment(window.location.hash);
  const load = useCallback(async () => {
    if (!token) { setError("This yard reply link is incomplete or expired."); return; }
    const value = await loadSupplier(token) as SupplierProjection;
    setStatus(value.request.status === "ordered" ? "ready_for_pickup" : ["available", "unavailable", "need_details", "ready_for_pickup"].includes(value.request.status) ? value.request.status : "available");
    setData(value);
  }, [loadSupplier, token]);
  useEffect(() => { load().catch((reason) => setError(reason.message || "Could not load this request.")); }, [load]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!data || saving) return;
    const form = new FormData(event.currentTarget);
    setSaving(true); setError(""); setSuccess("");
    const price = String(form.get("supplier_price") || "").trim();
    const body = {
      expected_revision: data.request.revision,
      status,
      part_number: String(form.get("part_number") || "").trim() || undefined,
      condition: String(form.get("condition") || "").trim() || undefined,
      pickup_window: String(form.get("pickup_window") || "").trim() || undefined,
      supplier_notes: String(form.get("supplier_notes") || "").trim() || undefined,
      supplier_price_cents: price ? Math.round(Number(price) * 100) : undefined,
    };
    try {
      const value = await reply(token, body) as SupplierProjection;
      setData(value); setSuccess("Yard response saved. Junkerz can now review the request.");
    } catch (reason) {
      const requestError = reason as Error & { status?: number };
      if (requestError.status === 409) {
        try { await load(); setError("This request changed while you were replying. The latest revision was reloaded; please review and send again."); }
        catch { setError("This request changed and the latest revision could not be loaded. Refresh before replying."); }
      } else setError(requestError.message || "Could not save the yard response.");
    } finally { setSaving(false); }
  };

  return <TokenShell eyebrow="Private yard reply">
    {!data && !error && <p role="status" className="mt-8 flex items-center gap-3 text-zinc-600"><Loader2 className="h-5 w-5 animate-spin" /> Loading request…</p>}
    {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {success && <p role="status" className="mt-6 flex gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900"><CheckCircle2 className="h-5 w-5 shrink-0" /> {success}</p>}
    {data && <>
      <div className="mt-5"><h1 className="text-3xl font-extrabold">Availability request {data.request.reference}</h1><p className="mt-3 text-lg text-zinc-700">{data.request.component || "Vehicle"} · {data.request.vehicle_label}</p>{data.request.target_vehicle && <p className="mt-2 text-sm text-zinc-500">Customer target: {data.request.target_vehicle}</p>}</div>
      {(data.request.vin || data.request.car_id || data.request.part_id || data.request.yard_location) && <div className="mt-5 grid gap-3 rounded-2xl border border-zinc-200 p-5 text-sm sm:grid-cols-2"><p><span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Stock identity</span>{data.request.vin || `Car #${data.request.car_id || '—'}`}{data.request.part_id ? ` · Part #${data.request.part_id}` : ''}</p><p><span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Yard location</span>{data.request.yard_location || 'Not recorded'}</p></div>}
      <div className="mt-6 grid gap-3 rounded-2xl bg-zinc-100 p-5 text-sm sm:grid-cols-2"><p><span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Current status</span>{pretty(data.request.status)}</p><p><span className="block text-xs font-bold uppercase tracking-wider text-zinc-500">Your quoted cost</span>{money(data.request.supplier_price_cents)}</p></div>
      {data.request.preparation && <YardPreparationPanel item={data.request.preparation} token={token} onChange={()=>void load()}/>}
      {!data.request.preparation && <form key={`${data.request.reference}:${data.request.revision}`} onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-semibold">Response<select aria-label="Response" value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 font-normal">{data.request.status === "ordered" ? <option value="ready_for_pickup">Ready for pickup</option> : <><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="need_details">Need details</option><option value="ready_for_pickup">Ready for pickup</option></>}</select></label>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Actual part number" name="part_number" disabled={data.request.status === "ordered"} defaultValue={data.request.part_number} /><Field label="Condition" name="condition" disabled={data.request.status === "ordered"} defaultValue={data.request.condition} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Supplier price (USD)" name="supplier_price" disabled={data.request.status === "ordered"} inputMode="decimal" defaultValue={data.request.supplier_price_cents == null ? "" : (data.request.supplier_price_cents / 100).toFixed(2)} /><Field label="Preparation / pickup window" name="pickup_window" defaultValue={data.request.pickup_window} /></div>
        <label className="block text-sm font-semibold">Yard notes<textarea name="supplier_notes" rows={3} defaultValue={data.request.supplier_notes} className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2 font-normal" /></label>
        {status === "available" && <p className="flex gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-950"><TriangleAlert className="h-5 w-5 shrink-0" /> Available confirms stock only. Junkerz still confirms fitment, customer price, payment, and collection.</p>}
        {status === "ready_for_pickup" && <p className="flex gap-2 rounded-xl bg-green-50 p-4 text-sm text-green-900"><PackageCheck className="h-5 w-5 shrink-0" /> Ready for pickup tells Junkerz preparation is complete. Include the pickup window above.</p>}
        <Button type="submit" disabled={saving} className="min-h-12 w-full">{saving ? <><Loader2 className="animate-spin" /> Saving…</> : "Send yard response"}</Button>
      </form>}
      <YardRequestConversation token={token} audience="supplier" />
      <p className="mt-7 text-xs leading-relaxed text-zinc-500">This link shows stock and preparation details only. Customer identity and retail pricing stay private with Junkerz.</p>
    </>}
  </TokenShell>;
}

function Field({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return <label className="block text-sm font-semibold">{label}<input name={name} {...props} className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 px-3 font-normal" /></label>;
}
