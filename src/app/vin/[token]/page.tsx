"use client";
import { API_BASE } from "@/lib/api-base";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vinError } from "@/lib/seller-vin";

const BASE = API_BASE;

type Offer = {
  id: number;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  last_owner_name?: string | null;
  last_owner_address?: string | null;
  title_state?: string | null;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

/**
 * VIN-only capture page, target of the 7-day VIN reminder email.
 * Accepts a restricted VIN reminder token or an existing seller token:
 *   - VIN (17 char)
 *   - Name on title
 *   - Address on title
 *   - State title was issued in
 *
 * Does NOT touch the schedule; the seller already picked their slot.
 * Reuses /api/public/junkerz/seller/vin-update/<token>.
 */
export default function VinUpdatePage() {
  const { token } = useParams<{ token: string }>();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [vin, setVin] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [titleState, setTitleState] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const loadOffer = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadErr(null);
    try {
      // VIN reminder tokens cannot authorize scheduling or expose contact details.
      const r = await fetch(`${BASE}/api/public/junkerz/seller/vin-update/${token}`);
      const data = await r.json();
      if (data?.error === "expired") {
        setLoadErr("This link has expired. Text or call Junkerz.");
        return;
      }
      if (!r.ok || data?.error) {
        setLoadErr(vinError(data?.error));
        return;
      }
      const details = data.offer ?? data;
      if (details.id) {
        setOffer(details);
        setVin(details.vin || "");
        setOwnerName(details.last_owner_name || "");
        setOwnerAddress(details.last_owner_address || "");
        setTitleState(details.title_state || "");
      } else {
        setLoadErr("Couldn't load your offer. Contact Junkerz.");
      }
    } catch (e) {
      setLoadErr((e as Error)?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadOffer(); }, [loadOffer]);

  const submit = async () => {
    if (!vin.trim() && !ownerName.trim() && !ownerAddress.trim() && !titleState) {
      setSubmitErr("Fill in at least one field, or close the page.");
      return;
    }
    setSaving(true); setSubmitErr(null);
    try {
      const r = await fetch(`${BASE}/api/public/junkerz/seller/vin-update/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: vin.trim() || null,
          last_owner_name: ownerName.trim() || null,
          last_owner_address: ownerAddress.trim() || null,
          title_state: titleState.trim() || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(vinError((data as { error?: string }).error));
      setSaved(true);
    } catch (e) {
      setSubmitErr((e as Error)?.message ?? "save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="p-12 text-center">Loading…</main>;
  if (loadErr) {
    return (
      <main className="max-w-md mx-auto pt-16 px-6 text-center space-y-3">
        <h1 className="text-2xl font-bold">Add VIN</h1>
        <p className="text-red-600">{loadErr}</p>
      </main>
    );
  }
  if (!offer) return null;

  if (saved) {
    return (
      <main className="max-w-md mx-auto pt-16 px-6 text-center space-y-4">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-bold">Got it — thanks</h1>
        <p className="text-slate-600">
          Your details are saved. Your pickup partner will review the vehicle and ownership documents with you.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto pt-8 px-4 pb-16 space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Add VIN + title info</h1>
        <p className="text-sm text-slate-600 mt-1">
          {offer.year} {offer.make} {offer.model}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Add the details you have to help prepare your paperwork. If the title is missing, discuss ownership documents with your pickup partner.
        </p>
      </header>

      {submitErr && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {submitErr}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="vin" className="text-sm font-semibold">VIN (17 characters)</Label>
          <Input
            id="vin"
            value={vin}
            onChange={(e) => setVin(e.target.value.toUpperCase())}
            placeholder="1HGBH41JXMN109186"
            maxLength={17}
            className="mt-1 font-mono"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Dashboard near the windshield, or driver-side door jamb sticker.
          </p>
        </div>

        <div>
          <Label htmlFor="owner-name" className="text-sm font-semibold">Name on the title</Label>
          <Input
            id="owner-name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="John Q Public"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="owner-address" className="text-sm font-semibold">Address on the title</Label>
          <Input
            id="owner-address"
            value={ownerAddress}
            onChange={(e) => setOwnerAddress(e.target.value)}
            placeholder="123 Main St, City, ST"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="title-state" className="text-sm font-semibold">State the title was issued in</Label>
          <select
            id="title-state"
            value={titleState}
            onChange={(e) => setTitleState(e.target.value)}
            className="w-full h-10 mt-1 border rounded px-2 text-sm"
          >
            <option value="">— pick a state —</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <Button onClick={submit} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </main>
  );
}
