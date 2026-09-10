/**
 * Where TikTok sends a staff member back after they approve the connection.
 *
 * This route exists on junkerz.com rather than on the admin because TikTok
 * only redirects to a URI registered on the app, and the app is registered
 * against this domain. It does almost nothing itself: it hands the one-time
 * `code` and the signed `state` to the backend, which does the token
 * exchange, and then sends the person somewhere that explains what happened.
 *
 * The code is single-use and short-lived, so it must not be logged, put in a
 * redirect URL, or rendered into the page.
 */
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "https://dankdash.ai";

// The code exchange is a live call to TikTok; do not let this be cached or
// prerendered.
export const dynamic = "force-dynamic";

function back(status: "connected" | "failed", detail?: string) {
  // The TikTok panel is a TAB on the Junkyard dashboard, not a route of its
  // own. /admin/junkerz/tiktok does not exist — every other legacy Junkerz
  // path has an explicit <Navigate> in App.jsx and this one never did, so
  // sending people there lands them on a blank page after a successful
  // connect. Go straight to the canonical URL.
  const url = new URL("/admin/junkyard", ADMIN_URL);
  url.searchParams.set("tab", "tiktok");
  url.searchParams.set("tiktok", status);
  if (detail) url.searchParams.set("reason", detail);
  return NextResponse.redirect(url.toString(), { status: 303 });
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  // TikTok reports a refusal here rather than by failing the redirect.
  const denied = params.get("error");
  if (denied) {
    return back("failed", denied);
  }

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    return back("failed", "missing_code_or_state");
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/tiktok/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
      cache: "no-store",
    });

    if (!res.ok) {
      // Read the reason but never echo the code back into the URL.
      const body = await res.json().catch(() => ({}));
      return back("failed", String(body?.error || res.status));
    }
    return back("connected");
  } catch {
    return back("failed", "backend_unreachable");
  }
}
