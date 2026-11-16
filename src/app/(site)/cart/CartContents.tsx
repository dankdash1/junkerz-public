"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Trash2, CarFront, Package, ArrowRight, Phone, ShieldCheck, Camera, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopCart } from "@/components/ShopCart";
import { money } from "@/components/CarPartsShop";
import {
  sectionForProductKind,
  type CatalogMode,
  type CatalogSettings,
  type ShopProduct,
  type ShopProductKind,
} from "@/lib/shop-catalog";
import { SITE } from "@/lib/site";
import { isStripeCheckoutUrl } from "@/lib/cart-checkout";

const categoryLinks: Record<ShopProductKind, string> = {
  car: "/shop?category=car",
  "parts-car": "/shop?category=parts-car",
  part: "/shop?category=part",
};

const categoryLabels: Record<ShopProductKind, string> = {
  car: "Cars",
  "parts-car": "Cars for parts",
  part: "Parts",
};

function ItemPhoto({ item }: { item: ShopProduct }) {
  const [failed, setFailed] = useState(false);
  const Icon = item.kind === "part" ? Package : CarFront;
  return <div className="relative flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 sm:w-40">
    {item.image && !failed ? <img src={item.image} alt={item.name} onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-3 px-3 py-6 text-center"><Icon className="h-12 w-12 text-zinc-400" strokeWidth={1.25} /><span className="flex items-center gap-1 text-xs text-zinc-500"><Camera className="h-3 w-3" /> Photo coming soon</span></div>}
  </div>;
}

export default function CartContents({ settings, settingsUnavailable, navigate = (url) => window.location.assign(url) }: { settings: CatalogSettings; settingsUnavailable: boolean; navigate?: (url: string) => void }) {
  const { items, remove, clear } = useShopCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [closed, setClosed] = useState("");
  const modeFor = (item: ShopProduct): CatalogMode => settings.sections[sectionForProductKind(item.kind)];
  const activeItems = settingsUnavailable ? [] : items.filter((item) => modeFor(item) === "live");
  const blockedItems = items.filter((item) => settingsUnavailable || modeFor(item) !== "live");
  const hasLiveSection = !settingsUnavailable && Object.values(settings.sections).some((mode) => mode === "live");
  const subtotal = activeItems.reduce((sum, item) => sum + (item.priceCents || 0), 0);
  const phoneHref = `tel:+1${SITE.phone.replace(/\D/g, "")}`;

  async function checkout() {
    setPending(true);
    setError("");
    setClosed("");
    try {
      // The key carries the catalog kind and the listing's database id; the
      // server route resolves it against the live catalog before the backend
      // opens checkout.
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: activeItems.map((item) => ({ key: item.key, quantity: 1 })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 503 && data.code === "checkout_disabled") {
        setClosed(data.error || "Checkout is not open yet.");
        setPending(false);
        return;
      }
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout is unavailable. Please try again.");
      if (!isStripeCheckoutUrl(data.url)) throw new Error("Checkout returned an unexpected address.");
      navigate(data.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout is unavailable.");
      setPending(false);
    }
  }

  if (!items.length) {
    const visibleKinds = (["car", "parts-car", "part"] as const).filter((kind) => settings.sections[sectionForProductKind(kind)] !== "off");
    return <section className="mt-8 rounded-2xl border border-zinc-200 bg-white px-6 py-14 text-center">
      <ShoppingCart className="mx-auto h-12 w-12 text-brand-600" aria-hidden="true" />
      <h2 className="mt-5 text-2xl font-bold">{hasLiveSection ? "Your cart is empty." : "Online shopping is coming soon."}</h2>
      <p className="mx-auto mt-3 max-w-xl text-zinc-600">
        {settingsUnavailable
          ? "Shop availability cannot be confirmed right now, so cart actions remain closed."
          : visibleKinds.length
            ? "Junkerz currently buys junk cars. Browse the available shop sections for launch updates."
            : "The public shop is currently closed. Junkerz still buys junk, wrecked and non-running cars."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {visibleKinds.map((kind) => <Link key={kind} href={categoryLinks[kind]} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-zinc-300 px-6 font-bold hover:border-brand-600 hover:text-brand-700">
          {kind === "part" ? <Package className="h-5 w-5" /> : <CarFront className="h-5 w-5" />} View {categoryLabels[kind].toLowerCase()}
        </Link>)}
        {!visibleKinds.length && <Link href="/quote" className="inline-flex min-h-12 items-center rounded-xl bg-brand-600 px-6 font-bold text-white">Get an offer for my car</Link>}
      </div>
    </section>;
  }

  return <>
    <p className="mt-3 text-zinc-500">Review your {items.length === 1 ? "saved item" : `${items.length} saved items`}. Availability and prices are checked again before checkout.</p>
    {(settingsUnavailable || blockedItems.length > 0) && <p role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
      {settingsUnavailable
        ? "Shop availability cannot be confirmed right now. Checkout remains closed."
        : `${blockedItems.length} saved ${blockedItems.length === 1 ? "item is" : "items are"} off or coming soon. Remove ${blockedItems.length === 1 ? "it" : "them"} before checkout.`}
    </p>}
    <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-6">
        {(["car", "parts-car", "part"] as const).map((kind) => {
          const group = items.filter((item) => item.kind === kind);
          if (!group.length) return null;
          const mode = settings.sections[sectionForProductKind(kind)];
          const Icon = kind === "part" ? Package : CarFront;
          return <section key={kind} aria-label={`${categoryLabels[kind]} in cart`} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold"><Icon className="h-5 w-5 text-brand-600" />{categoryLabels[kind]}<span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{group.length}</span></h2>
              {mode !== "off" && <Link href={categoryLinks[kind]} className="text-sm font-semibold text-brand-700">View section →</Link>}
            </div>
            <div className="divide-y divide-zinc-100">{group.map((item) => {
              const itemMode = settingsUnavailable ? "coming_soon" : modeFor(item);
              return <article key={item.key} className="p-5">
                <div className="flex flex-col gap-5 sm:flex-row">
                  <ItemPhoto item={item} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{categoryLabels[kind]} #{item.key.split(":").at(-1)}</p><h3 className="mt-1 text-xl font-bold leading-snug">{item.name}</h3></div>
                      <button aria-label={`Remove ${item.name}`} disabled={pending} onClick={() => remove(item.key)} className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                      <div><dt className="text-zinc-500">{kind === "part" ? "Condition" : "Mileage"}</dt><dd className="mt-0.5 font-medium capitalize">{kind === "part" ? item.condition || "Not provided" : typeof item.mileage === "number" && Number.isFinite(item.mileage) ? `${item.mileage.toLocaleString("en-US")} mi` : "Not provided"}</dd></div>
                      <div><dt className="text-zinc-500">Quantity</dt><dd className="mt-0.5 font-medium">1 {kind === "part" ? "part" : "vehicle"}</dd></div>
                    </dl>
                    {kind === "part" && <p className="mt-3 text-sm text-zinc-500"><span className="font-medium text-zinc-700">Listed fitment: </span>{item.detail || "Not provided — confirm fit before purchase."}</p>}
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className={`rounded-md px-2 py-1 text-[11px] font-semibold ${itemMode === "live" ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-700"}`}>{itemMode === "live" ? "Available" : itemMode === "off" ? "Section closed" : "Coming soon"}</span>
                      <p className="text-xl font-extrabold">{money(item.priceCents || 0)}</p>
                    </div>
                  </div>
                </div>
              </article>;
            })}</div>
          </section>;
        })}
        <div className="flex items-center justify-between gap-4">
          <Link href="/shop" className="py-2 text-sm font-semibold text-brand-700">← Shop status</Link>
          <button disabled={pending} onClick={clear} className="px-2 py-2 text-sm text-zinc-500 underline">Empty cart</button>
        </div>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h2 className="font-bold">Before you buy</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div><h3 className="text-sm font-semibold">Check the item</h3><p className="mt-1 text-sm leading-relaxed text-zinc-500">Confirm condition and availability. For parts, fitment must be verified for your vehicle.</p></div>
            <div><h3 className="flex items-center gap-2 text-sm font-semibold"><Truck className="h-4 w-4 text-brand-600" /> Parts delivery</h3><p className="mt-1 text-sm leading-relaxed text-zinc-500">Parts orders will be delivery only. Delivery details will be confirmed when parts sales open.</p></div>
          </div>
        </section>
      </div>
      <aside className="overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:sticky lg:top-24">
        <div className="bg-zinc-900 px-6 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Review</p><h2 className="mt-1 text-xl font-bold">Cart summary</h2></div>
        <div className="p-6">
          <div className="flex justify-between text-sm"><span className="text-zinc-500">Items ({activeItems.length})</span><strong>{money(subtotal)}</strong></div>
          {activeItems.length > 0 && blockedItems.length === 0 && !settingsUnavailable ? <>
            <div className="mt-5 flex items-center justify-between border-t border-zinc-200 pt-5"><span className="font-semibold">Subtotal</span><strong className="text-2xl">{money(subtotal)}</strong></div>
            <Button className="mt-6 h-12 w-full gap-2" disabled={pending} onClick={checkout}>{pending ? "Opening checkout…" : <>Checkout <ArrowRight className="h-4 w-4" /></>}</Button>
            {closed && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"><span className="font-semibold">Checkout is not open yet.</span> {closed.replace(/^Checkout is not open yet\.\s*/, "")}</p>}
            {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-zinc-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Secure card payment through Stripe. Prices and availability are checked again before you pay. Tax and delivery are shown at checkout.</p>
          </> : <p className="mt-5 border-t border-zinc-200 pt-5 text-sm leading-relaxed text-zinc-600">
            {activeItems.length === 0 ? "These shop sections are closed or coming soon, so checkout is unavailable." : "Remove closed or coming-soon items before checkout."}
          </p>}
        </div>
        <a href={phoneHref} className="flex items-center gap-3 border-t border-zinc-100 bg-zinc-50 px-6 py-5 hover:bg-zinc-100"><Phone className="h-5 w-5 text-brand-600" /><div><p className="text-xs text-zinc-500">Questions about an item?</p><p className="mt-1 font-bold">{SITE.phone}</p></div></a>
      </aside>
    </div>
  </>;
}
