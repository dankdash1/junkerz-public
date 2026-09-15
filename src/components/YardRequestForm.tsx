"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { customerFetch, getCustomer, sendCustomerLink, submitCustomerRequest } from "@/lib/customer-api";
import { Button } from "@/components/ui/button";
import {
  createYardRequestAttempt,
  submitYardRequest,
  type YardRequestAttempt,
  type YardRequestBody,
  type YardRequestReceipt,
} from "@/lib/yard-requests";

type RequestTarget = {
  kind: "donor_part" | "part" | "whole_car";
  carId?: number | null;
  partId?: number;
  label: string;
};

export function requestActionLabel(kind: RequestTarget["kind"]) {
  if (kind === "donor_part") return "Request a part from this car";
  if (kind === "whole_car") return "Request this car";
  return "Request this part";
}

export default function YardRequestForm({
  target,
  submitRequest = submitYardRequest,
  triggerClassName = "",
}: {
  target: RequestTarget;
  submitRequest?: (attempt: YardRequestAttempt) => Promise<YardRequestReceipt>;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendingAttempt, setPendingAttempt] = useState<YardRequestAttempt | null>(null);
  const [draft, setDraft] = useState<YardRequestBody | null>(null);
  const [verificationAttempt, setVerificationAttempt] = useState<YardRequestAttempt | null>(null);
  const [receipt, setReceipt] = useState<YardRequestReceipt | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const title = requestActionLabel(target.kind);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const initial = dialogRef.current?.querySelector<HTMLElement>("[data-initial-focus]") || dialogRef.current?.querySelector<HTMLElement>("button, input, select, textarea, a[href]");
    initial?.focus();
    return () => { (previous || triggerRef.current)?.focus(); };
  }, [open]);

  useEffect(() => {
    if (!open || submitRequest !== submitYardRequest) return;
    let active = true;
    void getCustomer().then(customer => {
      if (!active) return;
      for (const [name,value] of Object.entries({customer_name:customer.name,customer_email:customer.normalized_email,customer_phone:customer.phone})) {
        const input=dialogRef.current?.querySelector<HTMLInputElement>(`input[name="${name}"]`);
        if (input && !input.value) input.value=value;
      }
    }).catch(() => {});
    return () => { active=false; };
  }, [open, submitRequest]);

  const handleDialogKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && !saving) { event.preventDefault(); setOpen(false); return; }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]') || []);
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const send = async (attempt: YardRequestAttempt) => {
    if (saving) return;
    setSaving(true);
    setDraft({...attempt.body});
    setError("");
    try {
      let result: YardRequestReceipt;
      if (submitRequest === submitYardRequest) {
        const settings = await customerFetch<{enabled:boolean}>("settings");
        if (settings.enabled) {
          let customer;
          try { customer = await getCustomer(); }
          catch (reason) {
            if ((reason as {status?:number}).status !== 401) throw reason;
            await sendCustomerLink(attempt.body.customer_email, {request: {...attempt.body}});
            setVerificationAttempt(attempt);
            setPendingAttempt(null);
            return;
          }
          if (customer.normalized_email !== attempt.body.customer_email.trim().toLowerCase()) throw Object.assign(new Error(`Use your verified email ${customer.normalized_email}, or sign in with a different email.`), {status:403});
          result = await submitCustomerRequest({...attempt.body});
        } else result = await submitRequest(attempt);
      } else result = await submitRequest(attempt);
      setReceipt(result);
      setPendingAttempt(null);
    } catch (reason) {
      const requestError = reason as Error & { ambiguous?: boolean; status?: number };
      if (requestError.ambiguous || !requestError.status || requestError.status === 408 || requestError.status >= 500) setPendingAttempt(attempt);
      else setPendingAttempt(null);
      setError(requestError.message || "Could not send this request.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || pendingAttempt) return;
    const form = new FormData(event.currentTarget);
    const component = String(form.get("component") || "").trim();
    const body: Omit<YardRequestBody, "idempotency_key"> = {
      kind: target.kind,
      ...(target.kind !== "part" && target.carId ? { car_id: target.carId } : {}),
      ...(target.partId ? { part_id: target.partId } : {}),
      ...(component ? { component } : {}),
      customer_name: String(form.get("customer_name") || "").trim(),
      customer_email: String(form.get("customer_email") || "").trim(),
      customer_phone: String(form.get("customer_phone") || "").trim() || undefined,
      target_vehicle: String(form.get("target_vehicle") || "").trim() || undefined,
      message: String(form.get("message") || "").trim() || undefined,
    };
    await send(createYardRequestAttempt(body));
  };

  return <>
    <Button ref={triggerRef} type="button" variant="outline" className={`min-h-11 w-full border-brand-200 text-brand-700 hover:bg-brand-50 ${triggerClassName}`} onClick={() => setOpen(true)}>{title}</Button>
    {open && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setOpen(false); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-label={title} onKeyDown={handleDialogKeyDown} className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-xl sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-widest text-brand-700">Availability request</p><h2 className="mt-2 text-2xl font-extrabold">{title}</h2><p className="mt-2 text-sm text-zinc-600">{target.label}</p></div>
          <button type="button" aria-label="Close request form" disabled={saving} className="rounded-lg p-2 hover:bg-zinc-100 disabled:opacity-50" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        {receipt ? <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">
          <CheckCircle2 className="h-8 w-8 text-green-700" />
          <h3 className="mt-3 text-lg font-bold">Request {receipt.request.reference} received</h3>
          <p className="mt-2 text-sm text-green-900">This confirms receipt. Availability, condition, fitment, final price, and pickup still require confirmation.</p>
          <a href={receipt.status_url} className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-green-800 px-5 font-bold text-white">Check request status</a>
        </div> : verificationAttempt ? <section className="mt-7 rounded-xl border bg-zinc-50 p-5">
          <h3 className="text-xl font-bold">Verify your email to send this request</h3>
          <p className="mt-3">We saved your request and requested a sign-in email. Open its link, confirm sign-in, then send your saved request from My Junkerz. The yard has not been contacted yet.</p>
          <p className="mt-3 text-sm">Check your inbox and junk folder. Wait one minute before resending. Your request can be reopened on another device.</p>
          {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
          <div className="mt-5 flex flex-wrap gap-4"><a href="/account" className="min-h-11 underline">Open My Junkerz</a><button type="button" disabled={saving} className="min-h-11 underline" onClick={() => send(verificationAttempt)}>{saving ? "Requesting link…" : "Resend link / continue"}</button><button type="button" className="min-h-11 underline" onClick={() => setVerificationAttempt(null)}>Edit request</button></div>
          <p className="mt-3 text-sm">Need help? <a className="underline" href="tel:8174209180">Call 817-420-9180</a>.</p>
        </section> : <form className="mt-7 space-y-4" onSubmit={submit}>
          {target.kind === "donor_part" && <Field label="Part or component" name="component" defaultValue={draft?.component} required placeholder="Example: driver-side headlight" />}
          <Field label="Your name" name="customer_name" defaultValue={draft?.customer_name} required autoComplete="name" data-initial-focus />
          <Field label="Email" name="customer_email" defaultValue={draft?.customer_email} type="email" required autoComplete="email" />
          <Field label="Phone (optional)" name="customer_phone" defaultValue={draft?.customer_phone} type="tel" autoComplete="tel" />
          {target.kind !== "whole_car" && <Field label="Target vehicle (optional)" name="target_vehicle" defaultValue={draft?.target_vehicle} placeholder="Year, make, model, trim or VIN" />}
          <label className="block text-sm font-semibold text-zinc-800">Notes (optional)<textarea name="message" defaultValue={draft?.message} rows={3} className="mt-1.5 w-full rounded-xl border border-zinc-300 px-3 py-2 font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" /></label>
          <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">Submitting asks Junkerz to confirm stock with the holding yard. It does not reserve the item or create a paid order.</p>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
          {pendingAttempt ? <Button type="button" className="min-h-12 w-full" disabled={saving} onClick={() => send(pendingAttempt)}>{saving ? <><Loader2 className="animate-spin" /> Checking…</> : "Retry same request"}</Button>
            : <Button type="submit" className="min-h-12 w-full" disabled={saving}>{saving ? <><Loader2 className="animate-spin" /> Sending…</> : "Send request"}</Button>}
        </form>}
      </section>
    </div>}
  </>;
}

function Field({ label, name, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  return <label className="block text-sm font-semibold text-zinc-800">{label}<input name={name} {...props} className="mt-1.5 min-h-11 w-full rounded-xl border border-zinc-300 px-3 font-normal focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100" /></label>;
}
