const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const transpile = (file) => ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const catalog = [
  { key: "part:7", id: 7, kind: "part", priceCents: 1200, name: "Starter" },
  { key: "car:7", id: 7, kind: "car", priceCents: 250000, name: "2009 Ford Focus" },
];

// Loads the real proxy route and the real cart-checkout lib into a sandbox
// with an EMPTY environment: there is no Stripe key for the route to find.
function loadRoute(settings, backend = async () => Response.json({ url: "https://checkout.stripe.com/c/pay/cs_test_abc", session_id: "cs_test_abc123456", order_id: 91 })) {
  const backendCalls = [];
  const base = { process: { env: {} }, Request, Response, URL, URLSearchParams, AbortSignal, Intl, console };
  const lib = {};
  vm.runInNewContext(transpile("src/lib/cart-checkout.ts"), { ...base, exports: lib, require: () => { throw new Error("cart-checkout must not import anything"); } });
  const exports = {};
  vm.runInNewContext(transpile("src/app/api/cart/checkout/route.ts"), {
    ...base,
    exports,
    fetch: async (url, init) => { backendCalls.push({ url, init }); return backend(url, init); },
    require: (id) => {
      if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (id === "@/lib/cart-checkout") return lib;
      if (id === "@/lib/shop-catalog") return {
        validateCart: (items) => items,
        getCatalogSettings: async () => settings,
        getShopCatalog: async () => catalog,
        sectionForProductKey: (key) => (key.startsWith("part:") ? "parts" : "cars_for_sale"),
      };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });
  return { POST: exports.POST, backendCalls, lib };
}

const allLive = { sections: { parts: "live", cars_for_parts: "live", cars_for_sale: "live" }, parts_fulfillment: "delivery_only", checkout_enabled: false };
const post = (items) => new Request("https://junkerz.com/api/cart/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items }) });

test("checkout rejects a stale coming-soon item before any backend request", async () => {
  const { POST, backendCalls } = loadRoute({ ...allLive, sections: { ...allLive.sections, parts: "coming_soon" } });
  const response = await POST(post([{ key: "part:7", quantity: 1 }]));
  assert.equal(response.status, 409);
  assert.equal(backendCalls.length, 0);
  assert.match((await response.json()).error, /no longer available|coming soon/i);
});

test("a backend 503 checkout_disabled becomes a friendly 'not open yet' answer", async () => {
  const { POST } = loadRoute(allLive, async () => Response.json({ error: "checkout_disabled" }, { status: 503 }));
  const response = await POST(post([{ key: "part:7", quantity: 1 }]));
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.code, "checkout_disabled");
  assert.match(body.error, /^Checkout is not open yet\./);
  assert.equal(body.url, undefined);
});

test("a backend 200 returns Stripe's checkout URL and the order, sending listing database ids", async () => {
  const { POST, backendCalls } = loadRoute(allLive);
  const response = await POST(post([{ key: "part:7", quantity: 1 }, { key: "car:7", quantity: 1 }]));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { url: "https://checkout.stripe.com/c/pay/cs_test_abc", session_id: "cs_test_abc123456", order_id: "91" });
  assert.equal(backendCalls.length, 1);
  const [{ url, init }] = backendCalls;
  assert.equal(url, "https://api.dankdash.ai/api/junkyard-public/cart/checkout");
  assert.equal(init.method, "POST");
  assert.equal(init.redirect, "error");
  assert.equal(init.cache, "no-store");
  assert.deepEqual(JSON.parse(init.body), {
    items: [{ listing_id: 7, listing_kind: "part", quantity: 1 }, { listing_id: 7, listing_kind: "car", quantity: 1 }],
    success_url: "https://junkerz.com/cart/success?session_id={CHECKOUT_SESSION_ID}",
    cancel_url: "https://junkerz.com/cart",
  });
  // Nothing that looks like a credential leaves the site.
  assert.equal(init.headers.Authorization, undefined);
});

test("a backend 409 names the item that is gone", async () => {
  const { POST } = loadRoute(allLive, async () => Response.json({ error: "unavailable", listing_id: 7 }, { status: 409 }));
  const response = await POST(post([{ key: "part:7", quantity: 1 }]));
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.code, "unavailable");
  assert.match(body.error, /Starter is no longer available/);
});

test("only Stripe's hosted checkout may be handed to the browser", async () => {
  const { POST } = loadRoute(allLive, async () => Response.json({ url: "https://evil.example/pay", session_id: "cs_test_x", order_id: 1 }));
  const response = await POST(post([{ key: "part:7", quantity: 1 }]));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).url, undefined);
});

test("an unreachable backend is a 502 that took no payment, not a crash", async () => {
  const { POST } = loadRoute(allLive, async () => { throw new Error("connect ECONNREFUSED"); });
  const response = await POST(post([{ key: "part:7", quantity: 1 }]));
  assert.equal(response.status, 502);
  assert.match((await response.json()).error, /No payment was taken/);
});

test("the session reader trusts only a well-formed id and a well-formed backend answer", async () => {
  const { lib } = loadRoute(allLive);
  let calls = 0;
  const fetchImpl = async (url) => { calls++; assert.equal(url, "https://api.dankdash.ai/api/junkyard-public/cart/session/cs_test_abc123456"); return Response.json({ status: "paid", order_id: 91, order_number: "JZ-1091", total_cents: 251200 }); };
  assert.equal(await lib.readCheckoutSession("not-a-session", fetchImpl), null);
  assert.equal(await lib.readCheckoutSession("cs_test_abc123456/../x", fetchImpl), null);
  assert.equal(calls, 0);
  // The lib runs in its own vm context, so copy the result before a strict deepEqual (prototype identity).
  assert.deepEqual({ ...(await lib.readCheckoutSession("cs_test_abc123456", fetchImpl)) }, { status: "paid", orderId: "91", orderNumber: "JZ-1091", totalCents: 251200 });
  assert.equal(await lib.readCheckoutSession("cs_test_abc123456", async () => Response.json({ status: "refunded" })), null);
  assert.equal(await lib.readCheckoutSession("cs_test_abc123456", async () => Response.json({ error: "not_found" }, { status: 404 })), null);
});

test("no Stripe secret key or direct Stripe API call exists anywhere in the site", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry.name)) {
        const text = fs.readFileSync(file, "utf8");
        if (/STRIPE_[A-Z_]*(SECRET|KEY)|sk_(test|live)_|api\.stripe\.com/.test(text)) offenders.push(file);
      }
    }
  };
  walk("src");
  for (const file of ["next.config.mjs", ".env.example", ".env.local.example"]) {
    if (fs.existsSync(file) && /STRIPE/.test(fs.readFileSync(file, "utf8"))) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
