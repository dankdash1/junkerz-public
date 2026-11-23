"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";
import { shrinkPhoto } from "@/lib/shrink-photo";
import PickupShare from "@/components/junkerz/PickupShare";
import PrivatePhoto from "@/components/junkerz/PrivatePhoto";
import PaymentRecovery from "@/components/junkerz/PaymentRecovery";
import PickupStart from "@/components/junkerz/PickupStart";
import SignaturePad from "@/components/junkerz/SignaturePad";
import SignedBillOfSaleDownload from "@/components/junkerz/SignedBillOfSaleDownload";
import SellerAgreement, { agreementReady, type SellerAgreementData } from "@/components/junkerz/SellerAgreement";

type Detail = {
  agreement?: SellerAgreementData | null;
  match_id: number;
  car_offer_id: number;
  bid_cents: number | null;
  match_status: string;
  picked_up_charge_status: string | null;
  picked_up_charge_cents: number | null;
  picked_up_invoice_id: number | null;
  created_at: string;
  buyer_completed_at: string | null;
  vin: string | null;
  license_plate?: string | null;
  license_plate_state?: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  condition: string | null;
  offer_cents: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  zip_code: string | null;
  pickup_address: string | null;
  car_purchase_id: number | null;
  slot: string | null;
  eta_at: string | null;
  purchase_status: string | null;
  completed_at: string | null;
  pickup_order_id: number | null;
  po_status: string | null;
  photos: Array<{
    id: number;
    photo_kind: string;
    url: string;
    caption: string | null;
    taken_at: string;
  }>;
  signatures: Array<{
    id: number;
    signer_role: "seller" | "buyer";
    signer_name: string | null;
    signed_at: string;
    emailed_copy_to: string | null;
    emailed_copy_at: string | null;
  }>;
  completion: {
    buyer_completed_at: string | null;
    completed_via_app: boolean;
  };
};

const PHOTO_KINDS = [
  { key: "exterior_front", label: "Front" },
  { key: "exterior_rear", label: "Rear" },
  { key: "exterior_left", label: "Left side" },
  { key: "exterior_right", label: "Right side" },
  { key: "interior", label: "Interior" },
  { key: "dashboard", label: "Dashboard" },
  { key: "odometer", label: "Odometer" },
  { key: "vin_plate", label: "VIN plate" },
  { key: "title_document", label: "Title document" },
  { key: "plates_removed", label: "Plates removed" },
  { key: "id_document", label: "Seller ID (private)" },
  { key: "damage", label: "Damage" },
];

const fmtMoney = (cents: number | null | undefined) =>
  cents == null ? "—" : `$${(cents / 100).toFixed(0)}`;

export default function BuyerPickupDetail() {
  const router = useRouter();
  const { match_id } = useParams<{ match_id: string }>();
  const matchId = Number(match_id);

  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [onSite, setOnSite] = useState(false);
  const [busyKind, setBusyKind] = useState<string | null>(null);

  const [sellerName, setSellerName] = useState("");
  const [sigData, setSigData] = useState<string | null>(null);
  const [sigBusy, setSigBusy] = useState(false);
  const [sigErr, setSigErr] = useState<string | null>(null);
  const [agreementChanged, setAgreementChanged] = useState(false);

  const [completing, setCompleting] = useState(false);
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    setErr(null);
    try {
      const x = await buyerApi.pickupDetail(matchId);
      setD(x);
      if (x?.signatures?.some((s: { signer_role: string }) => s.signer_role === "seller")) {
        const s = x.signatures.find((s: { signer_role: string }) => s.signer_role === "seller");
        if (s?.signer_name) setSellerName(s.signer_name);
      } else if (x?.contact_name) {
        // Name from the quote, so the seller only checks it (George 11-01).
        setSellerName((cur) => cur || x.contact_name);
      }
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <main className="p-12 text-center">Loading…</main>;
  if (err || !d) {
    return (
      <main className="max-w-md mx-auto p-12 text-center space-y-3">
        <h1 className="text-xl font-bold">Pickup not available</h1>
        <p className="text-red-600">{err || "Not found or not yours."}</p>
        <Button onClick={() => router.push("/buyers/won-cars")} variant="outline">
          Back to won cars
        </Button>
      </main>
    );
  }

  const onPhotoPick = async (
    kind: string,
    ev: React.ChangeEvent<HTMLInputElement>
  ) => {
    const f = ev.target.files?.[0];
    ev.target.value = ""; // allow re-upload same file
    if (!f) return;
    setBusyKind(kind);
    try {
      await buyerApi.pickupPhoto(matchId, kind, await shrinkPhoto(f));
      await load();
    } catch (e) {
      setErr((e as Error)?.message ?? "photo upload failed");
    } finally {
      setBusyKind(null);
    }
  };

  const saveSignature = async () => {
    if (sigBusy || agreementChanged || !agreementReady(d.agreement) || !sellerName.trim()) return;
    if (!sigData) {
      setSigErr("Please sign before saving.");
      return;
    }
    setSigBusy(true);
    setSigErr(null);
    try {
      await buyerApi.pickupSignature(matchId, {
        signer_role: "seller",
        signer_name: sellerName.trim() || undefined,
        signature: sigData,
        document_revision: d.agreement!.document_revision!,
      });
      await load();
    } catch (e) {
      if ((e as Error)?.message === "document_changed") {
        setAgreementChanged(true);
        setSigErr("The agreement changed. Reload this page and review the updated details before signing.");
      } else setSigErr((e as Error)?.message ?? "signature save failed");
    } finally {
      setSigBusy(false);
    }
  };

  const markComplete = async () => {
    // George 11-17: a missing seller signature is the buyer's risk and never
    // blocks completion. Ask once, the same way the won-cars list confirms.
    if (!sellerSigned && !confirm("Mark complete without the seller's signature?")) return;
    setCompleting(true);
    setCompleteMsg(null);
    try {
      const r = await buyerApi.pickupComplete(matchId);
      const unsigned = r.seller_signed === false || r.email_result?.reason === "no_seller_signature";
      const emailLine = unsigned
        ? "Pickup marked complete. No seller signature was on file."
        : r.email_result?.sent
          ? `Seller copy emailed to ${r.email_result.sent_to}.`
          : `Pickup marked complete. Seller email could not be sent (${r.email_result?.reason || "no detail"}).`;
      const fee = typeof r.spread_cents === "number" ? `$${(r.spread_cents / 100).toFixed(2)}` : "the finder fee";
      const paymentLine = r.charge_status === "paid"
        ? `Finder fee paid: ${fee}.`
        : r.charge_status === "declined"
          ? `Payment needs attention: ${fee} was declined. Update your card, then retry payment below; matching is paused.`
          : `Finder fee payment is pending. See payment status below.`;
      setCompleteMsg(`✓ Pickup completed. ${paymentLine} ${emailLine}`);
      await load();
    } catch (e) {
      const msg = (e as Error)?.message;
      // An older backend may still answer 412 seller_signature_required.
      setCompleteMsg(msg === "seller_signature_required" || msg === "HTTP 412"
        ? "The server still requires the seller's signature. Please try again shortly."
        : msg ?? "complete failed");
    } finally {
      setCompleting(false);
    }
  };

  const sellerSigned = d.signatures.some((s) => s.signer_role === "seller");
  const isCompleted = !!d.completion?.buyer_completed_at;
  const addr = d.pickup_address || "(no address on file)";
  const mapsHref = d.pickup_address
    ? `https://maps.google.com/?q=${encodeURIComponent(d.pickup_address)}`
    : undefined;
  const vehicleStr = `${d.year ?? ""} ${d.make ?? ""} ${d.model ?? ""}`.trim();

  return (
    <main className="max-w-2xl mx-auto pt-6 px-4 pb-20 space-y-6">
      <header>
        <button onClick={() => router.push("/buyers/won-cars")}
                className="text-brand-700 text-sm">← Won cars</button>
        <h1 className="text-2xl font-bold mt-1">{vehicleStr || "Won car"}</h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">VIN {d.vin || "—"}{d.license_plate ? ` · Plate ${d.license_plate}${d.license_plate_state ? ` (${d.license_plate_state})` : ""}` : ""} · match #{d.match_id}</p>
      </header>

      <section className="bg-white border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500">Your winning bid</div>
            <div className="text-lg font-semibold text-brand-700">
              {fmtMoney(d.bid_cents)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Seller payout</div>
            <div className="text-lg font-semibold">{fmtMoney(d.offer_cents)}</div>
          </div>
        </div>
        {/* 2026-11-10 George: show the company login the split. Drivers use the
            pickup link (PickupMobile), which shows only the seller payout. */}
        {d.bid_cents != null && d.offer_cents != null &&
          (d.picked_up_charge_cents != null || (d.match_status === "won" && d.bid_cents > d.offer_cents)) && (
          <div className="border-t pt-3">
            <div className="text-xs text-slate-500">
              Junkerz finder fee {d.picked_up_charge_cents != null ? "" : "(charged to your card when you complete the pickup)"}
            </div>
            <div className="text-lg font-semibold">
              {fmtMoney(d.picked_up_charge_cents ?? Math.max(0, d.bid_cents - d.offer_cents))}
            </div>
            <div className="text-xs text-slate-500">
              Your bid {fmtMoney(d.bid_cents)} = seller payout {fmtMoney(d.offer_cents)} + finder fee{" "}
              {fmtMoney(d.picked_up_charge_cents ?? Math.max(0, d.bid_cents - d.offer_cents))}
            </div>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="text-xs text-slate-500">Pickup address</div>
          <div className="font-medium">{addr}</div>
          {mapsHref && (
            <a href={mapsHref} target="_blank" rel="noreferrer"
               className="text-xs text-brand-700 underline mt-1 inline-block">
              Open in Google Maps
            </a>
          )}
        </div>

        {d.slot && (
          <div className="border-t pt-3">
            <div className="text-xs text-slate-500">Scheduled slot</div>
            <div className="font-medium">{d.slot}</div>
            {d.eta_at && (
              <div className="text-xs text-slate-500">
                ETA {new Date(d.eta_at).toLocaleString()}
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">Seller contact</div>
            <div>{d.contact_name || "—"}</div>
            {d.contact_phone && (
              <a href={`tel:${d.contact_phone}`} className="text-brand-700 underline text-sm">
                {d.contact_phone}
              </a>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-500">Condition</div>
            <div className="capitalize">{(d.condition || "—").replace(/_/g, " ")}</div>
          </div>
        </div>
      </section>

      <PickupShare matchId={matchId} completed={isCompleted} />
      {sellerSigned && <SignedBillOfSaleDownload matchId={matchId} />}

      {!isCompleted && <PickupStart matchId={matchId} status={d.match_status === "delivered" ? "completed" : (d.po_status || d.purchase_status)} etaAt={d.eta_at} onStarted={load} />}

      {completeMsg && <p role="status" className="rounded border bg-white p-4 text-sm">{completeMsg} <a href="/buyers/settings" className="underline">Payment settings</a></p>}

      {isCompleted && d.photos.length > 0 && <section className="rounded-lg border bg-white p-4 space-y-3"><h2 className="font-semibold">Pickup photos ({d.photos.length})</h2><div className="grid grid-cols-2 gap-3">{d.photos.map(p => <PrivatePhoto key={p.id} id={p.id} label={p.photo_kind === "id_document" ? "seller ID · private" : p.photo_kind.replace(/_/g, " ")} load={buyerApi.pickupPhotoBlob}/>)}</div></section>}

      {isCompleted && <PaymentRecovery matchId={matchId} status={d.picked_up_charge_status} cents={d.picked_up_charge_cents} invoiceId={d.picked_up_invoice_id} onUpdated={async () => { setCompleteMsg(null); await load(); }} />}

      {isCompleted ? (
        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
          <div className="font-semibold text-brand-800">✓ Pickup completed</div>
          <div className="text-sm text-brand-700 mt-1">
            Completed {new Date(d.completion.buyer_completed_at!).toLocaleString()}.
          </div>
          {d.signatures.find((s) => s.signer_role === "seller")?.emailed_copy_at && (
            <div className="text-xs text-brand-700 mt-2">
              Seller copy emailed to {d.signatures.find((s) => s.signer_role === "seller")?.emailed_copy_to}.
            </div>
          )}
        </div>
      ) : !onSite ? (
        <Button onClick={() => setOnSite(true)} className="w-full h-12 text-base">
          📍 I&apos;m at the car
        </Button>
      ) : (
        <>
          <section className="bg-white border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Photos ({d.photos.length})</h2>
              <span className="text-xs text-slate-500">All photos saved to this match.</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PHOTO_KINDS.map((p) => (
                <label key={p.key}
                       className="border border-dashed border-slate-300 rounded p-3 text-center text-sm cursor-pointer hover:bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => void onPhotoPick(p.key, e)}
                    disabled={busyKind === p.key}
                  />
                  📷 {busyKind === p.key ? "Uploading…" : p.label}
                </label>
              ))}
            </div>
            {d.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                {d.photos.map((p) => (
                  <div key={p.id} className="border rounded overflow-hidden">
                    <PrivatePhoto id={p.id} label={p.photo_kind === "id_document" ? "seller ID · private" : p.photo_kind.replace(/_/g, " ")} load={buyerApi.pickupPhotoBlob}/>
                    <div className="px-1.5 py-1 text-[10px] text-slate-600">
                      {p.photo_kind.replace(/_/g, " ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold">Seller signs Bill of Sale</h2>
            {!sellerSigned && <>
            <p className="text-xs text-slate-600">
              Hand your phone to the seller to review the agreement below. A signed copy is saved and email delivery is attempted after signing.
            </p>
            <SellerAgreement agreement={d.agreement} />
            <div>
              <Label htmlFor="onsite-seller-name" className="text-xs">Seller&apos;s name (printed)</Label>
              <Input
                id="onsite-seller-name"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder={d.contact_name || "Seller name"}
              />
            </div>
            <SignaturePad
              onChange={setSigData}
              disabled={sigBusy || agreementChanged || !agreementReady(d.agreement)}
            />
            {sigErr && <div className="text-red-600 text-sm">{sigErr}</div>}
            <Button
              onClick={() => void saveSignature()}
              disabled={sigBusy || agreementChanged || !sigData || !sellerName.trim() || !agreementReady(d.agreement)}
              className="w-full"
            >
              {sigBusy ? "Saving…" : "Save signature"}
            </Button>
            </>}
            {sellerSigned && (
              <p className="text-xs text-brand-700">
                Signed by {d.signatures.find((s) => s.signer_role === "seller")?.signer_name || "seller"} at{" "}
                {new Date(d.signatures.find((s) => s.signer_role === "seller")!.signed_at).toLocaleString()}
              </p>
            )}
          </section>

          <section className="bg-white border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold">Mark complete</h2>
            <p className="text-xs text-slate-600">
              Complete this step after collecting the vehicle. It charges your saved card the finder fee
              {d.bid_cents != null && d.offer_cents != null ? ` of $${(Math.max(0, d.bid_cents - d.offer_cents) / 100).toFixed(2)}` : ""}.
            </p>
            {!sellerSigned && (
              <p className="text-xs text-amber-800">
                No seller signature on file. You can still mark complete — the missing signature is your responsibility.
              </p>
            )}
            <Button
              onClick={() => void markComplete()}
              disabled={completing}
              className="w-full h-12"
            >
              {completing ? "Completing…" : "Complete pickup & pay finder fee"}
            </Button>

          </section>
        </>
      )}
    </main>
  );
}
