"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, CarFront, Package, ArrowRight, Phone, ShieldCheck, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopCart } from "@/components/ShopCart";
import { money } from "@/components/CarPartsShop";
import type { ShopProduct } from "@/lib/shop-catalog";
import { SITE } from "@/lib/site";

function ItemPhoto({ item }: { item: ShopProduct }) {
  const [failed, setFailed] = useState(false);
  const Icon = item.kind === "car" ? CarFront : Package;
  return <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 sm:w-40">
    {item.image && !failed ? <img src={item.image} alt={item.name} onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-3 px-3 py-6 text-center"><Icon className="h-12 w-12 text-zinc-400" strokeWidth={1.25} /><span className="flex items-center gap-1 text-xs text-zinc-500"><Camera className="h-3 w-3" /> Photo coming soon</span></div>}
  </div>;
}

export default function CartContents() {
  const { items, remove, clear } = useShopCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const subtotal = items.reduce((sum, p) => sum + (p.priceCents || 0), 0);
  const phoneHref = `tel:+1${SITE.phone.replace(/\D/g, "")}`;
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
  if (!items.length) return <section className="mt-8 rounded-2xl border border-zinc-200 bg-white px-6 py-14 text-center">
    <ShoppingCart className="mx-auto h-12 w-12 text-brand-600" aria-hidden="true" />
    <h2 className="mt-5 text-2xl font-bold">Find your next car or the part you need.</h2>
    <p className="mt-3 text-zinc-600">Your cart is empty. Browse the catalog to get started.</p>
    <div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/shop?category=car" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-600 px-6 font-bold text-white"><CarFront className="h-5 w-5" /> Browse cars</Link><Link href="/shop?category=part" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-zinc-300 px-6 font-bold"><Package className="h-5 w-5" /> Browse parts</Link></div>
  </section>;
  return <>
    <p className="mt-3 text-zinc-500">Review your {items.length === 1 ? "item" : `${items.length} items`} before checkout. Your cart is saved in this browser tab.</p>
    <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {(["car", "part"] as const).map((kind) => {
          const group = items.filter((item) => item.kind === kind);
          if (!group.length) return null;
          const Icon = kind === "car" ? CarFront : Package;
          return <section key={kind} aria-label={kind === "car" ? "Cars in cart" : "Parts in cart"} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><h2 className="flex items-center gap-2 font-bold"><Icon className="h-5 w-5 text-brand-600" />{kind === "car" ? "Cars" : "Parts"}<span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{group.length}</span></h2><Link href={`/shop?category=${kind}`} className="text-sm font-semibold text-brand-700">Browse {kind === "car" ? "cars" : "parts"} →</Link></div>
            <div className="divide-y divide-zinc-100">{group.map((item) => <article key={item.key} className="p-5">
              <div className="flex flex-col gap-5 sm:flex-row"><ItemPhoto item={item} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{kind === "car" ? "Vehicle" : "Part"} #{item.key.split(":")[1]}</p><h3 className="mt-1 text-xl font-bold leading-snug">{item.name}</h3></div><button aria-label={`Remove ${item.name}`} disabled={pending} onClick={() => remove(item.key)} className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button></div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm"><div><dt className="text-zinc-500">{kind === "car" ? "Mileage" : "Condition"}</dt><dd className="mt-0.5 font-medium capitalize">{kind === "car" ? typeof item.mileage === "number" && Number.isFinite(item.mileage) ? `${item.mileage.toLocaleString("en-US")} mi` : "Not provided" : typeof item.condition === "string" && item.condition ? item.condition : "Not provided"}</dd></div><div><dt className="text-zinc-500">Quantity</dt><dd className="mt-0.5 font-medium">1 {kind === "car" ? "vehicle" : "part"}</dd></div></dl>
                  {kind === "part" && <p className="mt-3 text-sm text-zinc-500"><span className="font-medium text-zinc-700">Listed fitment: </span>{item.detail || "Not provided — confirm fit before purchase."}</p>}
                  <div className="mt-5 flex items-center justify-between gap-3"><span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">Test listing</span><p className="text-xl font-extrabold">{money(item.priceCents || 0)}</p></div>
                </div>
              </div>
            </article>)}</div>
          </section>;
        })}
        <div className="flex items-center justify-between gap-4"><Link href="/shop" className="py-2 text-sm font-semibold text-brand-700">← Continue shopping</Link><button disabled={pending} onClick={clear} className="px-2 py-2 text-sm text-zinc-500 underline">Empty cart</button></div>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5"><h2 className="font-bold">Before you buy</h2><div className="mt-4 grid gap-5 sm:grid-cols-2"><div><h3 className="text-sm font-semibold">Check the item</h3><p className="mt-1 text-sm leading-relaxed text-zinc-500">Confirm condition and availability. For parts, check compatibility with your vehicle.</p></div><div><h3 className="text-sm font-semibold">Confirm collection or delivery</h3><p className="mt-1 text-sm leading-relaxed text-zinc-500">Pickup, delivery, and any additional costs must be agreed before a real purchase.</p></div></div></section>
      </div>
      <aside className="overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:sticky lg:top-24">
        <div className="bg-zinc-900 px-6 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Review &amp; checkout</p><h2 className="mt-1 text-xl font-bold">Order summary</h2></div>
        <div className="p-6"><div className="flex justify-between text-sm"><span className="text-zinc-500">Items ({items.length})</span><strong>{money(subtotal)}</strong></div><div className="mt-3 flex justify-between text-sm"><span className="text-zinc-500">Delivery &amp; tax</span><span>Not calculated</span></div><div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-5"><span className="font-semibold">Test subtotal</span><strong className="text-2xl">{money(subtotal)}</strong></div>
          <Button className="mt-6 h-12 w-full gap-2" disabled={pending} onClick={checkout}>{pending ? "Opening Stripe…" : <>Test checkout <ArrowRight className="h-4 w-4" /></>}</Button>
          {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-zinc-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Stripe sandbox only. No real charge or reservation. Prices are checked again at checkout.</p>
          <Link href="/payments/test" className="mt-4 block text-center text-sm font-semibold text-brand-700 underline">Test-card instructions</Link>
        </div>
        <a href={phoneHref} className="flex items-center gap-3 border-t border-zinc-100 bg-zinc-50 px-6 py-5 hover:bg-zinc-100"><Phone className="h-5 w-5 text-brand-600" /><div><p className="text-xs text-zinc-500">Questions about an item?</p><p className="mt-1 font-bold">{SITE.phone}</p></div></a>
      </aside>
    </div>
  </>;
}
