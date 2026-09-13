const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function loadRoute(settings, stripeKey = "sk_test_example") {
  const stripeCalls = [];
  const code = ts.transpileModule(fs.readFileSync("src/app/api/cart/checkout/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  const sandbox = {
    exports,
    process: { env: { STRIPE_SANDBOX_SECRET_KEY: stripeKey } },
    Request,
    Response,
    URLSearchParams,
    AbortSignal,
    fetch: async (url) => {
      stripeCalls.push(url);
      return Response.json({ livemode: false, url: "https://checkout.stripe.com/test" });
    },
    require: (id) => {
      if (id === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (id === "@/lib/shop-catalog") return {
        validateCart: (items) => items,
        getCatalogSettings: async () => settings,
        getShopCatalog: async () => [{ key: "part:7", priceCents: 1200, name: "Starter" }],
        sectionForProductKey: () => "parts",
      };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  };
  vm.runInNewContext(code, sandbox);
  return { POST: exports.POST, stripeCalls };
}

test("checkout rejects a stale coming-soon item before any Stripe request", async () => {
  const { POST, stripeCalls } = loadRoute({
    sections: { parts: "coming_soon", cars_for_parts: "live", cars_for_sale: "live" },
    parts_fulfillment: "delivery_only",
    checkout_enabled: false,
  });
  const response = await POST(new Request("https://junkerz.com/api/cart/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items: [{ key: "part:7", quantity: 1 }] }),
  }));
  assert.equal(response.status, 409);
  assert.equal(stripeCalls.length, 0);
  assert.match((await response.json()).error, /no longer available|coming soon/i);
});

test("checkout always refuses a live Stripe key without a network request", async () => {
  const { POST, stripeCalls } = loadRoute({
    sections: { parts: "live", cars_for_parts: "live", cars_for_sale: "live" },
    parts_fulfillment: "delivery_only",
    checkout_enabled: false,
  }, "sk_live_forbidden");
  const response = await POST(new Request("https://junkerz.com/api/cart/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items: [{ key: "part:7", quantity: 1 }] }),
  }));
  assert.equal(response.status, 503);
  assert.equal(stripeCalls.length, 0);
});
