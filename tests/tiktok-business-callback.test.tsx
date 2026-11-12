// @vitest-environment node
// Written, NOT run (2026-11-11: the Mac's memory guard said NO; write-only rule).
import { afterEach, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/tiktok-business/callback/route";

afterEach(() => { vi.unstubAllGlobals(); });

function req(qs: string) {
  return new NextRequest(`https://junkerz.com/api/tiktok-business/callback${qs}`);
}

test("forwards code + state to the backend Business callback and redirects to the panel", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ connected: true }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);

  const res = await GET(req("?code=ONE-TIME-CODE&state=SIGNED"));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toMatch(/\/api\/admin\/tiktok-business\/callback$/);
  expect(init.method).toBe("POST");
  expect(JSON.parse(init.body)).toEqual({ code: "ONE-TIME-CODE", state: "SIGNED" });

  expect(res.status).toBe(303);
  const loc = res.headers.get("location") || "";
  expect(loc).toContain("/admin/junkyard");
  expect(loc).toContain("tab=tiktok");
  expect(loc).toContain("tiktok_business=connected");
  // The one-time code never lands in a URL.
  expect(loc).not.toContain("ONE-TIME-CODE");
});

test("a refusal from TikTok goes back as failed without calling the backend", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const res = await GET(req("?error=access_denied&state=S"));
  expect(fetchMock).not.toHaveBeenCalled();
  expect(res.headers.get("location")).toContain("tiktok_business=failed");
});

test("missing code is refused", async () => {
  vi.stubGlobal("fetch", vi.fn());
  const res = await GET(req("?state=S"));
  expect(res.headers.get("location")).toContain("reason=missing_code_or_state");
});

test("backend error is reported without the code", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: "exchange_failed", detail: "40002" }), { status: 400 })));
  const res = await GET(req("?code=SECRETCODE&state=S"));
  const loc = res.headers.get("location") || "";
  expect(loc).toContain("tiktok_business=failed");
  expect(loc).toContain("reason=40002");
  expect(loc).not.toContain("SECRETCODE");
});
