import { getAttribution } from "@/lib/attribution";
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

export async function submitQuote(payload: {
  vin?: string; year: number; make: string; model: string;
  vehicle_lookup_token?: string;
  condition: string; title_status: string;
  zip_code: string; photo_count?: number;
  trim?: string; mileage?: number;
  make_id?: number | null; model_id?: number | null;
  runs?: boolean; starts?: boolean;
  all_wheels_attached?: boolean; all_tires_inflated?: boolean;
  // Which axle is flat — decides wheel-lift vs flatbed.
  flat_tire_position?: "none" | "front" | "rear" | "both";
  engine_state?: "intact" | "partial" | "missing";
  transmission_state?: "intact" | "partial" | "missing";
  has_catalytic?: boolean; has_battery?: boolean; has_keys?: boolean;
  damage_zones?: Record<string, "none" | "some">;
  contact_phone: string; contact_email: string;
  pickup_address?: string;
}) {
  // Attach where this seller came from, so the offer row can say
  // whether the car arrived from Google, Bing, Facebook or direct.
  const attribution = getAttribution() || undefined;
  const r = await fetch(`${BASE}/api/public/junkerz/quote`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ ...payload, attribution }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as any).error || `quote failed: ${r.status}`);
  }
  return r.json();
}

export async function getOffer(offerId: number) {
  const r = await fetch(`${BASE}/api/public/junkerz/offer/${offerId}`);
  if (!r.ok) throw new Error(`offer load failed: ${r.status}`);
  return r.json();
}

export async function sendOtp(phone: string) {
  const r = await fetch(`${BASE}/api/public/junkerz/otp/send`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({phone}),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as any).error || `otp/send failed: ${r.status}`);
  }
  return r.json();
}

export async function verifyOtp(phone: string, code: string) {
  const r = await fetch(`${BASE}/api/public/junkerz/otp/verify`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({phone, code}),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as any).error || `otp/verify failed: ${r.status}`);
  }
  return r.json();
}

/** What the seller is being asked to accept or turn down. */
export async function getOfferForToken(token: string) {
  const r = await fetch(`${BASE}/api/public/junkerz/seller/decline/${token}`);
  if (!r.ok) throw new Error(`lookup failed: ${r.status}`);
  return r.json();
}

/** The seller says no — and tells us why. */
export async function declineOffer(token: string, body: {
  reason: "price" | "timing" | "already_sold" | "other";
  note?: string;
  desired_cents?: number;
  competitor_name?: string;
  competitor_cents?: number;
  wants_callback?: boolean;
}) {
  const r = await fetch(`${BASE}/api/public/junkerz/seller/decline/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error((e as { error?: string }).error || `decline failed: ${r.status}`);
  }
  return r.json();
}
