// Where the site's server calls go.
//
// Web filters (dealership, hotel, office Wi-Fi) file every *.dankdash.ai name
// under "drugs", so a browser that calls api.dankdash.ai directly gets cut off
// there: empty Year/Make lists and a quote form that cannot send (2026-11-02).
// In the browser we call our own /api/... instead; src/middleware.ts relays it
// to the backend. Server code (no window) still calls the backend directly.
export const API_DIRECT = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai").trim();
export const API_BASE = typeof window === "undefined" ? API_DIRECT : "";
