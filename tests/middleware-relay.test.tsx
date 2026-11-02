// @vitest-environment node
import { afterEach, expect, test } from "vitest";
import { NextRequest } from "next/server";
import { middleware, config } from "@/middleware";

afterEach(() => { delete process.env.JUNKERZ_EDGE_SECRET; });

function relayed(res: Response) {
  return {
    to: res.headers.get("x-middleware-rewrite"),
    edge: res.headers.get("x-middleware-request-x-junkerz-edge"),
    ip: res.headers.get("x-middleware-request-x-junkerz-client-ip"),
  };
}

test("browser /api calls are relayed to the backend under our own name, with the real client address", () => {
  process.env.JUNKERZ_EDGE_SECRET = "s".repeat(40);
  const req = new NextRequest("https://junkerz.com/api/junkerz/vehicles/years?x=1", { headers: { "x-forwarded-for": "98.7.6.5, 10.0.0.1" } });
  const r = relayed(middleware(req));
  expect(r.to).toBe("https://api.dankdash.ai/api/junkerz/vehicles/years?x=1");
  expect(r.edge).toBe("s".repeat(40));
  expect(r.ip).toBe("98.7.6.5");
});

test("a visitor cannot pass their own secret or address through", () => {
  const req = new NextRequest("https://junkerz.com/api/public/junkerz/quote", { headers: { "x-junkerz-edge": "forged", "x-junkerz-client-ip": "1.2.3.4" } });
  const r = relayed(middleware(req));
  expect(r.edge).toBeNull();
  expect(r.ip).toBeNull();
});

test("only backend paths are relayed; the site's own /api routes are not", () => {
  const m = config.matcher.join(" ");
  for (const own of ["/api/customer", "/api/cart", "/api/mcp", "/api/tiktok"]) expect(m).not.toContain(own);
  for (const be of ["/api/junkerz", "/api/buyers", "/api/public", "/api/junkyard-public", "/api/pickup-access"]) expect(m).toContain(be);
});
