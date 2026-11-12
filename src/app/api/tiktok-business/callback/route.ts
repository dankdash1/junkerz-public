/**
 * Where TikTok sends a staff member back after approving the TikTok API for
 * Business ("Junkerz Posting") connection.
 *
 * The twin of /api/tiktok/callback (the older Content Posting app), and it
 * works the same way: TikTok only redirects to the URL registered on the app,
 * which is https://junkerz.com/api/tiktok-business/callback, so this route
 * hands the one-time `code` and the signed `state` to the backend
 * (POST /api/admin/tiktok-business/callback), which does the token exchange,
 * then sends the browser back to the admin TikTok panel.
 *
 * The code is single-use. It is never logged, never put in a redirect URL,
 * and never rendered.
 */
import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || "https://dankdash.ai";

export const dynamic = "force-dynamic";

function back(status: "connected" | "failed", detail?: string) {
  // The TikTok panel is a tab on the Junkyard dashboard (same target as the
  // older callback), with a separate query key so the panel can tell which
  // connection the outcome belongs to.
  const url = new URL("/admin/junkyard", ADMIN_URL);
  url.searchParams.set("tab", "tiktok");
  url.searchParams.set("tiktok_business", status);
  if (detail) url.searchParams.set("reason", detail.slice(0, 80));
  return NextResponse.redirect(url.toString(), { status: 303 });
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;

  const denied = params.get("error");
  if (denied) {
    return back("failed", denied);
  }

  // TikTok's authorize page returns `code`; accept `auth_code` too.
  const code = params.get("code") || params.get("auth_code");
  const state = params.get("state");
  if (!code || !state) {
    return back("failed", "missing_code_or_state");
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/tiktok-business/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state }),
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return back("failed", String(body?.detail || body?.error || res.status));
    }
    return back("connected");
  } catch {
    return back("failed", "backend_unreachable");
  }
}
