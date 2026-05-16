"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";
import SignaturePad from "@/components/junkerz/SignaturePad";

type Detail = {
  match_id: number;
  car_offer_id: number;
  bid_cents: number | null;
  match_status: string;
  created_at: string;
  buyer_completed_at: string | null;
  vin: string | null;
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
      await buyerApi.pickupPhoto(matchId, kind, f);
      await load();
    } catch (e) {
      setErr((e as Error)?.message ?? "photo upload failed");
    } finally {
      setBusyKind(null);
    }
  };

  const saveSignature = async () => {
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
      });
      await load();
    } catch (e) {
      setSigErr((e as Error)?.message ?? "signature save failed");
    } finally {
      setSigBusy(false);
    }
  };

  const markComplete = async () => {
    setCompleting(true);
    setCompleteMsg(null);
    try {
      const r = await buyerApi.pickupComplete(matchId);
      const emailLine = r.email_result?.sent
        ? `Seller copy emailed to ${r.email_result.sent_to}.`
        : `Pickup marked complete. Seller email could not be sent (${r.email_result?.reason || "no detail"}).`;
      setCompleteMsg(`✓ Done. ${emailLine}`);
      await load();
    } catch (e) {
      setCompleteMsg((e as Error)?.message ?? "complete failed");
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
                className="text-emerald-700 text-sm">← Won cars</button>
        <h1 className="text-2xl font-bold mt-1">{vehicleStr || "Won car"}</h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">VIN {d.vin || "—"} · match #{d.match_id}</p>
      </header>

      <section className="bg-white border rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-slate-500">Your winning bid</div>
            <div className="text-lg font-semibold text-emerald-700">
              {fmtMoney(d.bid_cents)}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Seller payout</div>
            <div className="text-lg font-semibold">{fmtMoney(d.offer_cents)}</div>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="text-xs text-slate-500">Pickup address</div>
          <div className="font-medium">{addr}</div>
          {mapsHref && (
            <a href={mapsHref} target="_blank" rel="noreferrer"
               className="text-xs text-emerald-700 underline mt-1 inline-block">
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
              <a href={`tel:${d.contact_phone}`} className="text-emerald-700 underline text-sm">
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

      {isCompleted ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="font-semibold text-emerald-800">✓ Pickup completed</div>
          <div className="text-sm text-emerald-700 mt-1">
            Completed {new Date(d.completion.buyer_completed_at!).toLocaleString()}.
          </div>
          {d.signatures.find((s) => s.signer_role === "seller")?.emailed_copy_at && (
            <div className="text-xs text-emerald-700 mt-2">
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
                    <img
                      src={
                        (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai") +
                        p.url
                      }
                      alt={p.photo_kind}
                      className="w-full h-24 object-cover"
                    />
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
            <p className="text-xs text-slate-600">
              Hand your phone to the seller. They sign below — we&apos;ll email
              them a copy after you mark complete.
            </p>
            <div>
              <Label className="text-xs">Seller&apos;s name (printed)</Label>
              <Input
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder={d.contact_name || "Seller name"}
              />
            </div>
            <SignaturePad
              onChange={setSigData}
              disabled={sellerSigned}
            />
            {sigErr && <div className="text-red-600 text-sm">{sigErr}</div>}
            <Button
              onClick={() => void saveSignature()}
              disabled={sigBusy || sellerSigned || !sigData}
              className="w-full"
            >
              {sellerSigned ? "✓ Signed" : sigBusy ? "Saving…" : "Save signature"}
            </Button>
            {sellerSigned && (
              <p className="text-xs text-emerald-700">
                Signed by {d.signatures.find((s) => s.signer_role === "seller")?.signer_name || "seller"} at{" "}
                {new Date(d.signatures.find((s) => s.signer_role === "seller")!.signed_at).toLocaleString()}
              </p>
            )}
          </section>

          <section className="bg-white border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold">Mark complete</h2>
            <p className="text-xs text-slate-600">
              Requires the seller&apos;s signature on file. Marking complete
              auto-emails them their signed Bill of Sale.
            </p>
            <Button
              onClick={() => void markComplete()}
              disabled={!sellerSigned || completing}
              className="w-full h-12"
            >
              {completing ? "Completing…" : "✓ Mark pickup complete"}
            </Button>
            {completeMsg && (
              <p className={`text-sm ${completeMsg.startsWith("✓") ? "text-emerald-700" : "text-red-600"}`}>
                {completeMsg}
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
