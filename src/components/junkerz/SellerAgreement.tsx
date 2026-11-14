export type SellerAgreementData = {
  buyer_name?: string | null; buyer_address?: string | null; buyer_phone?: string | null;
  seller_name?: string | null; seller_address?: string | null; seller_zip?: string | null;
  seller_phone?: string | null; seller_email?: string | null;
  year?: number | null; make?: string | null; model?: string | null; vin?: string | null;
  condition?: string | null; license_plate?: string | null; license_plate_state?: string | null;
  title_status?: string | null; title_state?: string | null;
  last_owner_name?: string | null; last_owner_address?: string | null; mileage?: number | null;
  seller_price_cents?: number | null; agreement_text?: string | null; document_revision?: string | null;
};

export function agreementReady(agreement?: SellerAgreementData | null): boolean {
  return !!(agreement?.buyer_name?.trim() && agreement.buyer_address?.trim()
    && agreement.seller_name?.trim() && agreement.seller_address?.trim()
    && agreement.document_revision?.trim() && agreement.agreement_text?.trim()
    && agreement.year && agreement.make?.trim() && agreement.model?.trim() && agreement.vin?.trim()
    && typeof agreement.seller_price_cents === "number" && Number.isFinite(agreement.seller_price_cents)
    && agreement.seller_price_cents > 0);
}

export default function SellerAgreement({ agreement }: { agreement?: SellerAgreementData | null }) {
  return <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4 text-sm" aria-label="Bill of Sale agreement">
    <h3 className="font-semibold text-base">Review your Bill of Sale</h3>
    {!agreementReady(agreement) && <p role="alert" className="text-amber-900">Agreement details are missing. Contact Junkerz to complete them before signing.</p>}
    {agreement && <>
      <div><h4 className="font-semibold">Buyer</h4><p>{agreement.buyer_name || "Not provided"}</p><p>{agreement.buyer_address || "Address not provided"}</p>{agreement.buyer_phone && <p>{agreement.buyer_phone}</p>}</div>
      <div><h4 className="font-semibold">Seller</h4><p>{agreement.seller_name || "Not provided"}</p><p>{agreement.seller_address || "Address not provided"}{agreement.seller_zip ? ` · ${agreement.seller_zip}` : ""}</p>{agreement.seller_phone && <p>{agreement.seller_phone}</p>}{agreement.seller_email && <p>{agreement.seller_email}</p>}</div>
      <div className="space-y-1"><h4 className="font-semibold">Vehicle and price</h4>
        <p>{[agreement.year, agreement.make, agreement.model].filter(Boolean).join(" ") || "Vehicle details not provided"}</p>
        <p>VIN: {agreement.vin || "Not provided"}</p>
        {(agreement.license_plate || agreement.license_plate_state) && <p>License plate: {agreement.license_plate || "Not provided"}{agreement.license_plate_state ? ` (${agreement.license_plate_state})` : ""}</p>}
        {agreement.condition && <p>Condition: {agreement.condition}</p>}
        {agreement.title_status && <p>Title status: {agreement.title_status}</p>}
        {agreement.title_state && <p>Title state: {agreement.title_state}</p>}
        {agreement.last_owner_name && <p>Name on title: {agreement.last_owner_name}</p>}
        {agreement.last_owner_address && <p>Address on title: {agreement.last_owner_address}</p>}
        {agreement.mileage != null && <p>Mileage: {agreement.mileage.toLocaleString()}</p>}
        <p className="font-semibold">Seller price: {typeof agreement.seller_price_cents === "number" ? `$${(agreement.seller_price_cents / 100).toFixed(2)}` : "Not provided"}</p>
      </div>
      {agreement.agreement_text && <p className="whitespace-pre-wrap border-t border-slate-200 pt-3 leading-relaxed">{agreement.agreement_text}</p>}
      <p>Check these details before signing. Contact Junkerz if anything is incorrect.</p>
    </>}
  </section>;
}
