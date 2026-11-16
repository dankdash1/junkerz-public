"use client";
import { API_BASE } from "@/lib/api-base";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import SignaturePad from "@/components/junkerz/SignaturePad";
import { SITE } from "@/lib/site";

type Preview = {
  pickup_order_id: number;
  document_revision: string;
  agreement_text: string;
  already_signed?: boolean;
  buyer_name?: string | null;
  buyer_address?: string | null;
  buyer_phone?: string | null;
  seller_name?: string | null;
  seller_address?: string | null;
  seller_phone?: string | null;
  seller_email?: string | null;
  seller_zip?: string | null;
  last_owner_name?: string | null;
  last_owner_address?: string | null;
  vehicle: { year: number; make: string; model: string;
    vin: string; condition?: string; title_status?: string; mileage?: number | null; title_state?: string | null;
    license_plate?: string | null; license_plate_state?: string | null };
  sale_price_cents: number;
};
type Receipt = {
  ok: boolean;
  pickup_order_id: number;
  signature_id: number;
  receipt_email?: { sent: boolean; reason?: string };
};

export default function SellerSignPage() {
  const token = String(useParams().token);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [signerName, setSignerName] = useState("");
  const [copyEmail, setCopyEmail] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [documentChanged, setDocumentChanged] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/junkerz/seller/sign/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error("This signing link is unavailable. Contact Junkerz for help.")))
      .then((p: Preview) => {
        if (!active) return;
        setPreview(p); setSignerName(p.seller_name || ""); setCopyEmail(p.seller_email || "");
      })
      .catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [token]);

  const partyDetailsReady = !!(preview?.buyer_name?.trim() && preview.buyer_address?.trim() && preview.seller_name?.trim() && preview.seller_address?.trim() && preview.vehicle.vin?.trim() && preview.agreement_text?.trim());

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!signature || !signerName.trim() || !partyDetailsReady || !preview?.document_revision || documentChanged || submitting.current) return;
    submitting.current = true;
    setBusy(true); setError(null);
    try {
      const r = await fetch(`${API_BASE}/api/junkerz/seller/sign/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_data_url: signature, signer_name: signerName.trim(), seller_email: copyEmail.trim() || undefined, document_revision: preview.document_revision }),
      });
      const data = await r.json().catch(() => ({}));
      if (data.error === "document_changed") {
        setDocumentChanged(true);
        throw new Error("The agreement changed after you opened it. Reload this page to review the updated details before signing.");
      }
      if (!r.ok || data.ok !== true || !data.signature_id) {
        throw new Error("We could not confirm your signed copy was saved. Contact Junkerz before trying again.");
      }
      setReceipt(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not confirm your signature. Contact Junkerz for help.");
    } finally {
      submitting.current = false; setBusy(false);
    }
  };

  if (receipt) return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Your signed Bill of Sale is saved</h1>
      <p>Your signature and signed PDF have been saved. Reference: {receipt.pickup_order_id} / {receipt.signature_id}.</p>
      <p>{receipt.receipt_email?.sent
        ? "Your signed copy has been sent by email. Check your inbox and spam folder."
        : "Email delivery has not been confirmed. Contact Junkerz for your saved copy."}</p>
      <a className="underline" href={SITE.phoneHref}>{SITE.phone}</a>
    </main>
  );
  if (!preview) return <main className="p-12">{error ? <p role="alert">{error} <a className="underline" href={SITE.phoneHref}>{SITE.phone}</a></p> : "Loading…"}</main>;
  if (preview.already_signed) return <main className="p-6 max-w-2xl mx-auto space-y-4">
    <h1 className="text-2xl font-bold">Your signed Bill of Sale is saved</h1>
    <p>This agreement has already been signed. Reference: {preview.pickup_order_id}.</p>
    <p>{preview.vehicle.year} {preview.vehicle.make} {preview.vehicle.model} · ${(preview.sale_price_cents / 100).toFixed(2)}</p>
    <p>Contact Junkerz for help with your saved copy: <a className="underline" href={SITE.phoneHref}>{SITE.phone}</a>.</p>
  </main>;

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Review and sign your Bill of Sale</h1>
      <form onSubmit={submit} className="bg-white rounded shadow p-6 space-y-4">
        <div className="space-y-2">
          <h2 className="font-semibold">Buyer</h2>
          <p>{preview.buyer_name || "Buyer details pending"}</p>
          <p><b>Address:</b> {preview.buyer_address || "Not provided"}</p>
          {preview.buyer_phone && <p><b>Phone:</b> {preview.buyer_phone}</p>}
        </div>
        <div className="space-y-2 border-t pt-4">
          <h2 className="font-semibold">Seller</h2>
          <p>{preview.seller_name || "Seller details pending"}</p>
          <label className="block text-sm font-semibold">
            Name of person signing
            <input required className="mt-1 w-full rounded border px-3 py-2 font-normal" value={signerName}
              onChange={e => setSignerName(e.target.value)} autoComplete="name" disabled={busy} />
          </label>
          <p><b>Seller-provided pickup address:</b> {preview.seller_address || "Not provided"}{preview.seller_zip ? `, ${preview.seller_zip}` : ""}</p>
          {preview.seller_phone && <p><b>Phone:</b> {preview.seller_phone}</p>}
          <label className="block text-sm font-semibold">
            Email for your signed copy
            <input className="mt-1 w-full rounded border px-3 py-2 font-normal" type="email"
              value={copyEmail} onChange={e => setCopyEmail(e.target.value)} autoComplete="email" inputMode="email" disabled={busy} />
          </label>
        </div>
        <div className="space-y-2 border-t pt-4">
          <p><b>Vehicle:</b> {preview.vehicle.year} {preview.vehicle.make} {preview.vehicle.model}</p>
          {preview.vehicle.vin && <p><b>VIN:</b> {preview.vehicle.vin}</p>}
          {preview.vehicle.license_plate && <p><b>License plate:</b> {preview.vehicle.license_plate}{preview.vehicle.license_plate_state ? ` (${preview.vehicle.license_plate_state})` : ""}</p>}
          {preview.vehicle.condition && <p><b>Condition:</b> {preview.vehicle.condition}</p>}
          {preview.vehicle.title_status && <p><b>Title status:</b> {preview.vehicle.title_status}</p>}
          {preview.vehicle.title_state && <p><b>Title state:</b> {preview.vehicle.title_state}</p>}
          {preview.vehicle.mileage != null && <p><b>Mileage:</b> {preview.vehicle.mileage}</p>}
          {preview.last_owner_name && <p><b>Reported title owner:</b> {preview.last_owner_name}</p>}
          {preview.last_owner_address && <p><b>Reported title-owner address:</b> {preview.last_owner_address}</p>}
          <p><b>Sale price:</b> ${(preview.sale_price_cents / 100).toFixed(2)}</p>
        </div>
        <p className="text-sm text-slate-600">Check the buyer, seller, vehicle, and price before signing. If anything is missing or incorrect, contact Junkerz at <a className="underline" href={SITE.phoneHref}>{SITE.phone}</a>.</p>
        {!partyDetailsReady && <p role="alert" className="rounded bg-amber-50 p-3 text-sm text-amber-950">Buyer or seller details are missing. Contact Junkerz to complete them before signing.</p>}
        {!preview.document_revision && <p role="alert">The agreement could not be verified. Contact Junkerz before signing.</p>}
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <p className="text-sm border-t pt-4">{preview.agreement_text}</p>
        <SignaturePad onChange={setSignature} disabled={busy || !partyDetailsReady || documentChanged || !preview.document_revision} />
        <Button type="submit" className="w-full" disabled={busy || !signature || !signerName.trim() || !partyDetailsReady || documentChanged || !preview.document_revision}>
          {busy ? "Saving signed copy…" : "I confirm and sign"}
        </Button>
      </form>
    </main>
  );
}
