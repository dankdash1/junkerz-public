import { NextResponse } from "next/server";
import { getShopCatalog, validateCart } from "@/lib/shop-catalog";

export async function POST(request: Request) {
  let items;
  try { items = validateCart((await request.json()).items); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid cart." }, { status: 400 }); }
  const key = process.env.STRIPE_SANDBOX_SECRET_KEY;
  // Fail closed: a live key must never turn this public test cart into live sales.
  if (!key || !key.startsWith("sk_test_")) return NextResponse.json({ error: "Your cart is ready. Sandbox cart checkout is awaiting its Stripe connection; no payment was taken." }, { status: 503 });
  try {
    const catalog = await getShopCatalog();
    const form = new URLSearchParams({ mode: "payment", success_url: "https://junkerz.com/cart/success?session_id={CHECKOUT_SESSION_ID}", cancel_url: "https://junkerz.com/shop", "metadata[source]": "junkerz_sandbox_cart", "metadata[organization_id]": "4", "submit_type": "pay" });
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const product = catalog.find((p) => p.key === item.key);
      if (!product || product.priceCents === null) return NextResponse.json({ error: "An item is no longer available or needs a price. Please return to the shop." }, { status: 409 });
      form.set(`line_items[${index}][quantity]`, String(item.quantity));
      form.set(`line_items[${index}][price_data][currency]`, "usd");
      form.set(`line_items[${index}][price_data][unit_amount]`, String(product.priceCents));
      form.set(`line_items[${index}][price_data][product_data][name]`, `${product.name} — SANDBOX`);
    }
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form, signal: AbortSignal.timeout(15000) });
    const session = await response.json();
    if (!response.ok || session.livemode !== false || !session.url) return NextResponse.json({ error: "Stripe sandbox checkout is unavailable. No payment was taken. Please try again." }, { status: 502 });
    return NextResponse.json({ url: session.url });
  } catch { return NextResponse.json({ error: "Could not load checkout. Please try again." }, { status: 502 }); }
}
