import test from "node:test";
import assert from "node:assert/strict";
import * as catalog from "../src/lib/shop-catalog.ts";

const { getShopCatalog, validateCart } = catalog;

const allLive = {
  sections: { parts: "live", cars_for_parts: "live", cars_for_sale: "live" },
  parts_fulfillment: "delivery_only",
  checkout_enabled: false,
};

test("car and part IDs remain distinct and client prices are discarded", () => {
  assert.deepEqual(validateCart([{ key: "car:7", quantity: 1, price: 1 }, { key: "part:7", quantity: 1 }]), [{ key: "car:7", quantity: 1 }, { key: "part:7", quantity: 1 }]);
});
test("cart rejects duplicates, fabricated kinds, extra quantities and empty input", () => {
  for (const bad of [[], null, [{key:"car:1",quantity:2}], [{key:"car:1",quantity:1},{key:"car:1",quantity:1}], [{key:"furniture:1",quantity:1}], [{key:"part:0",quantity:1}]]) assert.throws(() => validateCart(bad));
});
test("catalog preserves trusted prices and refuses missing or invalid prices", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    return Response.json({items: url.includes('/cars?') ? [{id:7,year:2025,make:'TEST',model:'Car',mileage:123456,asking_price_cents:55000},{id:8,asking_price_cents:null}] : [{id:7,part_name:'Test part',condition:'like_new',price_cents:12000},{id:8,price_cents:-1}]});
  };
  try {
    const products = await getShopCatalog(allLive);
    assert.deepEqual(products.map((p)=>[p.key,p.priceCents,p.maxQuantity]), [['car:7',55000,1],['car:8',null,1],['parts-car:7',null,1],['parts-car:8',null,1],['part:7',12000,1],['part:8',null,1]]);
    assert.equal(products[0].mileage, 123456);
    assert.equal(products[1].mileage, null);
    assert.equal(products.find((product) => product.key === 'part:7').condition, 'like new');
    assert(calls.every((url)=>url.startsWith('https://api.dankdash.ai/api/junkyard-public/')));
  } finally { globalThis.fetch = original; }
});

test("catalog settings accept only the exact public fail-closed contract", () => {
  const valid = {
    sections: { parts: "coming_soon", cars_for_parts: "off", cars_for_sale: "live" },
    parts_fulfillment: "delivery_only",
    checkout_enabled: false,
  };
  assert.deepEqual(catalog.parseCatalogSettings(valid), valid);
  for (const bad of [
    null,
    { ...valid, checkout_enabled: true },
    { ...valid, parts_fulfillment: "pickup" },
    { ...valid, sections: { ...valid.sections, parts: "preview" } },
    { ...valid, sections: { parts: "live", cars_for_sale: "live" } },
    { ...valid, preview: true },
  ]) assert.throws(() => catalog.parseCatalogSettings(bad));
});

test("mixed modes fetch only live sections and preserve their public category", async () => {
  const calls = [];
  const settings = {
    sections: { parts: "live", cars_for_parts: "coming_soon", cars_for_sale: "off" },
    parts_fulfillment: "delivery_only",
    checkout_enabled: false,
  };
  const products = await getShopCatalog(settings, async (url, options) => {
    calls.push([url, options]);
    return Response.json({ items: [{ id: 14, part_name: "Alternator", price_cents: 9900 }], count: 1, state: "live" });
  });
  assert.deepEqual(calls.map(([url]) => url), ["https://api.dankdash.ai/api/junkyard-public/parts-inventory?limit=200"]);
  assert.equal(calls[0][1].cache, "no-store");
  assert.deepEqual(products.map(({ key, kind, section }) => ({ key, kind, section })), [
    { key: "part:14", kind: "part", section: "parts" },
  ]);
});

test("all coming-soon settings expose no catalog data", async () => {
  let requests = 0;
  const products = await getShopCatalog({
    sections: { parts: "coming_soon", cars_for_parts: "coming_soon", cars_for_sale: "coming_soon" },
    parts_fulfillment: "delivery_only",
    checkout_enabled: false,
  }, async () => { requests++; throw new Error("must not fetch"); });
  assert.deepEqual(products, []);
  assert.equal(requests, 0);
});

test("opening a coming-soon category still preloads live products for a client category transition", async () => {
  const calls = [];
  const settings = {
    sections: { parts: "live", cars_for_parts: "coming_soon", cars_for_sale: "coming_soon" },
    parts_fulfillment: "delivery_only",
    checkout_enabled: false,
  };
  const result = await catalog.loadShopPageCatalog(settings, "car", async (url) => {
    calls.push(url);
    return Response.json({
      items: [{ id: 901, part_name: "Preview alternator", condition: "good", price_cents: 12900 }],
      count: 1,
      state: "live",
    });
  });
  assert.equal(result.notFound, false);
  assert.deepEqual(calls, ["https://api.dankdash.ai/api/junkyard-public/parts-inventory?limit=200"]);
  assert.deepEqual(result.products.map(({ key, name }) => ({ key, name })), [
    { key: "part:901", name: "Preview alternator" },
  ]);
});
