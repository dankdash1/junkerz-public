"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopCart } from "@/components/ShopCart";
import { money } from "@/components/CarPartsShop";

export default function CartContents() {
  const { items, remove, clear } = useShopCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function checkout() {
    setPending(true); setError("");
    try {
      const response = await fetch("/api/cart/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map((p) => ({ key: p.key, quantity: 1 })) }) });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout is unavailable. Please try again.");
      const url = new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Checkout returned an unexpected address.");
      window.location.assign(url.href);
    } catch (e) { setError(e instanceof Error ? e.message : "Checkout is unavailable."); setPending(false); }
  }
  if (!items.length) return <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
    <ShoppingCart className="mx-auto h-12 w-12 text-zinc-300" aria-hidden="true" />
    <h2 className="mt-5 text-xl font-bold">Your cart is empty</h2>
    <p className="mt-3 text-zinc-600">Add cars or individual parts from the shop.</p>
    <Link href="/shop" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-600 px-6 font-bold text-white">Shop cars &amp; parts →</Link>
  </section>;
  return <>
    <p className="mt-3 text-zinc-500">{items.length} {items.length === 1 ? "listing" : "listings"} · One of each item · Cart clears on refresh during testing.</p>
    <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
      <section aria-label="Cart items" className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
        {items.map((item) => <article key={item.key} className="flex items-start gap-4 p-5">
          {item.image && <img src={item.image} alt="" className="h-20 w-20 rounded-lg object-cover" />}
          <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase text-brand-700">{item.kind}</p><h2 className="mt-1 font-bold">{item.name}</h2><p className="mt-2 text-sm text-zinc-500">Quantity: 1</p><p className="mt-2 font-semibold">{money(item.priceCents || 0)}</p></div>
          <button aria-label={`Remove ${item.name}`} disabled={pending} onClick={() => remove(item.key)} className="rounded-lg p-3 text-zinc-500 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-5 w-5" /></button>
        </article>)}
      </section>
      <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-bold">Order summary</h2>
        <div className="mt-5 flex justify-between"><span>Items subtotal</span><strong>{money(items.reduce((sum, p) => sum + (p.priceCents || 0), 0))}</strong></div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-500">Sandbox prices only. Delivery and tax are not calculated in this test. Checkout rechecks item prices.</p>
        <Button className="mt-6 h-12 w-full" disabled={pending} onClick={checkout}>{pending ? "Opening Stripe…" : "Test checkout"}</Button>
        {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
        <Link href="/payments/test" className="mt-4 block text-center text-sm font-semibold text-brand-700 underline">View test-card instructions</Link>
      </aside>
    </div>
    <div className="mt-6 flex justify-between gap-4"><Link href="/shop" className="py-3 font-semibold text-brand-700">← Continue shopping</Link><button disabled={pending} onClick={clear} className="px-3 py-3 text-sm text-zinc-500 underline">Empty cart</button></div>
  </>;
}
