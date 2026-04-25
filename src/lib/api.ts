const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

export async function submitQuote(payload: {
  vin: string; year: number; make: string; model: string;
  condition: string; title_status: string; weight_lbs: number;
  zip_code: string; photo_count?: number;
}) {
  const r = await fetch(`${BASE}/api/public/junkerz/quote`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload),
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
  return r.json();
}

export async function verifyOtp(phone: string, code: string) {
  const r = await fetch(`${BASE}/api/public/junkerz/otp/verify`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({phone, code}),
  });
  return r.json();
}
