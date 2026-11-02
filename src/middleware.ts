import { NextRequest, NextResponse } from "next/server";
import { API_DIRECT } from "@/lib/api-base";

// Relay the browser's /api calls to the backend under the junkerz.com name
// (see src/lib/api-base.ts). The backend only believes X-Junkerz-Client-IP
// when X-Junkerz-Edge carries the shared secret, so each customer keeps their
// own rate limit instead of all sharing Vercel's address.
export function middleware(req: NextRequest) {
  const target = new URL(req.nextUrl.pathname + req.nextUrl.search, API_DIRECT);
  const headers = new Headers(req.headers);
  headers.delete("x-junkerz-edge");
  headers.delete("x-junkerz-client-ip");
  const ip = req.ip || req.headers.get("x-real-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  const secret = process.env.JUNKERZ_EDGE_SECRET;
  if (secret && ip) {
    headers.set("x-junkerz-edge", secret);
    headers.set("x-junkerz-client-ip", ip);
  }
  return NextResponse.rewrite(target, { request: { headers } });
}

export const config = {
  matcher: [
    "/api/junkerz/:path*",
    "/api/buyers/:path*",
    "/api/public/:path*",
    "/api/junkyard-public/:path*",
    "/api/pickup-access/:path*",
  ],
};
