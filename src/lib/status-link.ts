// The seller's pickup status needs the offer's seller schedule token (backend WP0-260 / TRADE-191).
// The token rides in the PAGE link's fragment (#token=), which the browser never sends to any server,
// and goes to the API only in the X-Seller-Schedule-Token header, never in an API URL.
export const STATUS_TOKEN_HEADER = "X-Seller-Schedule-Token";

/** The token from a status page link: the fragment first (#token=), then ?token= for older links. */
export function readStatusToken(search: URLSearchParams | null, hash = ""): string | null {
  const fromHash = new URLSearchParams(hash.replace(/^#/, "")).get("token");
  const raw = (fromHash ?? search?.get("token") ?? "").trim();
  return raw.length >= 16 ? raw : null;
}

/** The status page link a seller can keep: the token in the fragment only. */
export function statusHref(offerId: number, token: string): string {
  return `/status/${encodeURIComponent(String(offerId))}#token=${encodeURIComponent(token)}`;
}

export function statusRequestInit(token: string): RequestInit {
  return { headers: { [STATUS_TOKEN_HEADER]: token }, cache: "no-store" };
}
