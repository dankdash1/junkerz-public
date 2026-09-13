import test from "node:test";
import assert from "node:assert/strict";
import { getShopCatalog, validateCart } from "../src/lib/shop-catalog.ts";

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
    return Response.json({items: url.includes('/cars?') ? [{id:7,year:2025,make:'TEST',model:'Car',asking_price_cents:55000},{id:8,asking_price_cents:null}] : [{id:7,part_name:'Test part',price_cents:12000},{id:8,price_cents:-1}]});
  };
  try {
    const products = await getShopCatalog();
    assert.deepEqual(products.map((p)=>[p.key,p.priceCents,p.maxQuantity]), [['car:7',55000,1],['car:8',null,1],['part:7',12000,1],['part:8',null,1]]);
    assert(calls.every((url)=>url.startsWith('https://api.dankdash.ai/api/junkyard-public/')));
  } finally { globalThis.fetch = original; }
});
