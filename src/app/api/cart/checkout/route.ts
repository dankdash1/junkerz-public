import { NextResponse } from "next/server";
import { getCatalogSettings, getShopCatalog, sectionForProductKey, validateCart } from "@/lib/shop-catalog";
import { CART_BACKEND, CHECKOUT_CANCEL_URL, CHECKOUT_CLOSED_MESSAGE, CHECKOUT_SUCCESS_URL, isStripeCheckoutUrl } from "@/lib/cart-checkout";

export const dynamic = "force-dynamic";

// Server-side proxy: the browser sends catalog keys, this route turns them
// into the backend's listing ids and asks the backend to open checkout. No
// Stripe credential lives in the site; the backend owns the order and the
// Stripe session.
function json(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  let items;
  try { items = validateCart((await request.json()).items); }
  catch (e) { return json({ error: e instanceof Error ? e.message : "Invalid cart.", code: "invalid_cart" }, 400); }
  let settings;
  try { settings = await getCatalogSettings(); }
  catch { return json({ error: "Checkout is temporarily unavailable. No payment was taken.", code: "catalog_unavailable" }, 503); }
  if (items.some((item) => {
    const section = sectionForProductKey(item.key);
    return !section || settings.sections[section] !== "live";
  })) {
    return json({ error: "An item is no longer available or is coming soon. Please return to the shop.", code: "unavailable" }, 409);
  }
  let catalog;
  try { catalog = await getShopCatalog(settings); }
  catch { return json({ error: "Checkout is temporarily unavailable. No payment was taken.", code: "catalog_unavailable" }, 503); }
  const lines = [];
  for (const item of items) {
    // The cart key is `${kind}:${id}` built from the catalog row; the backend
    // gets the row's database id, resolved again here from the live catalog.
    const product = catalog.find((p) => p.key === item.key);
    if (!product || product.priceCents === null) return json({ error: "An item is no longer available or needs a price. Please return to the shop.", code: "unavailable" }, 409);
    lines.push({ product, listing_id: product.id, listing_kind: product.kind, quantity: item.quantity });
  }
  const body = {
    items: lines.map(({ listing_id, listing_kind, quantity }) => ({ listing_id, listing_kind, quantity })),
    success_url: CHECKOUT_SUCCESS_URL,
    cancel_url: CHECKOUT_CANCEL_URL,
  };
  try {
    const upstream = await fetch(`${CART_BACKEND}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    const data: Record<string, unknown> = await upstream.json().catch(() => ({}));
    if (upstream.status === 503 && data.error === "checkout_disabled") {
      return json({ error: CHECKOUT_CLOSED_MESSAGE, code: "checkout_disabled" }, 503);
    }
    if (upstream.status === 409) {
      const gone = lines.find((line) => line.listing_id === Number(data.listing_id));
      const name = gone ? gone.product.name : "An item";
      return json({ error: `${name} is no longer available. Remove it from your cart to continue.`, code: "unavailable", listing_id: gone ? gone.listing_id : null }, 409);
    }
    if (!upstream.ok || !isStripeCheckoutUrl(data.url)) {
      return json({ error: "Checkout could not be started. No payment was taken. Please try again.", code: "checkout_failed" }, 502);
    }
    return json({
      url: data.url,
      session_id: typeof data.session_id === "string" ? data.session_id : null,
      order_id: typeof data.order_id === "string" || typeof data.order_id === "number" ? String(data.order_id) : null,
    });
  } catch { return json({ error: "Could not reach checkout. No payment was taken. Please try again.", code: "checkout_failed" }, 502); }
}
