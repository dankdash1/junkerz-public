"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, CarFront, Package, Plus, ShoppingCart, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopCart } from "@/components/ShopCart";
import YardRequestForm from "@/components/YardRequestForm";
import { submitYardRequest, type YardRequestAttempt, type YardRequestReceipt } from "@/lib/yard-requests";
import {
  categoryMode,
  sectionForProductKind,
  visibleShopCategories,
  type CatalogSettings,
  type ShopCategory,
  type ShopProduct,
  type ShopProductKind,
} from "@/lib/shop-catalog";

export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

const labels: Record<ShopCategory, string> = {
  all: "All",
  car: "Cars for sale",
  "parts-car": "Cars for parts",
  part: "Parts",
};

function ComingSoon({ category }: { category: ShopProductKind }) {
  const isPart = category === "part";
  return <section className="rounded-2xl border border-zinc-200 bg-white p-7 sm:p-9">
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
      {isPart ? <Package className="h-6 w-6" /> : <CarFront className="h-6 w-6" />}
    </div>
    <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-700">{labels[category]}</p>
    <h2 className="mt-2 text-2xl font-extrabold">Coming soon</h2>
    <p className="mt-3 max-w-xl leading-relaxed text-zinc-600">
      {isPart
        ? "We are preparing real parts inventory for online browsing. Parts will be delivery only when this section opens."
        : category === "parts-car"
          ? "We are preparing donor-vehicle listings so you can see which cars may have parts available."
          : "We are preparing approved vehicles for public browsing."}
    </p>
    {isPart && <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-zinc-700"><Truck className="h-4 w-4 text-brand-600" /> Delivery only when parts launch</p>}
  </section>;
}

export default function CarPartsShop({
  products,
  settings,
  settingsUnavailable,
  unavailable,
  requestIntakeEnabled = false,
  submitRequest = submitYardRequest,
  initialCategory = "all",
}: {
  products: ShopProduct[];
  settings: CatalogSettings;
  settingsUnavailable: boolean;
  unavailable: boolean;
  requestIntakeEnabled?: boolean;
  submitRequest?: (attempt: YardRequestAttempt) => Promise<YardRequestReceipt>;
  initialCategory?: ShopCategory;
}) {
  const [filter, setFilter] = useState<ShopCategory>(initialCategory);
  const [search, setSearch] = useState("");
  const { items, add } = useShopCart();
  const categories = visibleShopCategories(settings);
  const selected: ShopProductKind[] = filter === "all"
    ? categories.filter((value): value is ShopProductKind => value !== "all")
    : [filter];
  const liveCategories = selected.filter((category) => categoryMode(settings, category) === "live");
  const comingSoonCategories = selected.filter((category) => categoryMode(settings, category) === "coming_soon");
  const shown = products.filter((product) =>
    liveCategories.includes(product.kind) &&
    `${product.name} ${product.detail}`.toLowerCase().includes(search.toLowerCase())
  );
  const activeCartItems = items.filter((item) => settings.sections[sectionForProductKind(item.kind)] === "live");

  return <>
    {categories.length > 1 && <div className="flex flex-wrap gap-2" aria-label="Catalog categories">
      {categories.map((value) => <Button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} variant={filter === value ? "default" : "outline"} className="min-h-11 px-5">{labels[value]}</Button>)}
    </div>}

    {settingsUnavailable && <p role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
      Shop availability cannot be confirmed right now, so listings and cart actions remain closed.
    </p>}

    {comingSoonCategories.length > 0 && <div className="mt-6 grid gap-5 md:grid-cols-2">
      {comingSoonCategories.map((category) => <ComingSoon key={category} category={category} />)}
    </div>}

    {liveCategories.length > 0 && <>
      <div className="mt-6 flex justify-end">
        <input aria-label="Search cars and parts" type="search" placeholder="Search cars, parts, make or model" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-lg border border-zinc-300 px-4 sm:w-80" />
      </div>
      {unavailable ? <p role="alert" className="mt-8 rounded-xl bg-amber-50 p-6">The live catalog is temporarily unavailable. Please refresh to try again.</p> : <>
        <p className="my-5 text-sm text-zinc-500">{shown.length} listings · {requestIntakeEnabled ? "Request availability; approve the confirmed quote before payment." : "Availability must be confirmed before any future sale."}</p>
        {shown.length === 0 && <p className="rounded-xl border p-8">No matching live listings. Try another search or category.</p>}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((product) => {
            const added = items.some((item) => item.key === product.key);
            const VehicleIcon = product.kind === "part" ? Package : CarFront;
            return <article key={product.key} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <div className="relative flex aspect-[4/3] items-center justify-center bg-zinc-100">
                {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" /> : <VehicleIcon className="h-16 w-16 text-zinc-300" aria-hidden="true" />}
                {requestIntakeEnabled && <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">Availability to confirm</span>}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{labels[product.kind]}</p>
                <h2 className="mt-2 text-lg font-bold">{product.name}</h2>
                <p className="mt-2 text-sm text-zinc-500">{product.detail}</p>
                <p className="mb-4 mt-5 text-2xl font-extrabold">{product.priceCents === null ? (requestIntakeEnabled ? "Quote after confirmation" : "Price needed") : money(product.priceCents)}</p>
                {requestIntakeEnabled && product.priceCents !== null && <p className="-mt-2 mb-4 text-xs text-zinc-500">Listed price · final quote requires confirmation</p>}
                {product.href && <Link href={product.href} className="mb-2 inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-bold text-zinc-800 hover:bg-zinc-50">View details</Link>}
                {requestIntakeEnabled && <div className="mb-2"><YardRequestForm
                  target={{
                    kind: product.kind === "parts-car" ? "donor_part" : product.kind === "car" ? "whole_car" : "part",
                    carId: product.carId,
                    partId: product.kind === "part" ? product.id : undefined,
                    label: product.name,
                  }}
                  submitRequest={submitRequest}
                /></div>}
                {!requestIntakeEnabled && <Button className="mt-auto h-11 w-full gap-2" disabled={added || product.priceCents === null || items.length >= 30} onClick={() => add(product)}>
                  {added ? <><ShoppingCart className="h-4 w-4" /> In cart</> : <><Plus className="h-4 w-4" /> Add to cart</>}
                </Button>}
              </div>
            </article>;
          })}
        </div>
      </>}
    </>}

    {!requestIntakeEnabled && activeCartItems.length > 0 && <div className="sticky bottom-5 mt-6 flex items-center justify-between gap-4 rounded-xl bg-zinc-900 px-5 py-4 text-white shadow-xl" role="status">
      <span>{activeCartItems.length} {activeCartItems.length === 1 ? "item" : "items"} in your cart</span>
      <Link href="/cart" className="rounded-lg bg-white px-4 py-2 font-bold text-zinc-900">View cart →</Link>
    </div>}

    {!settingsUnavailable && liveCategories.length === 0 && comingSoonCategories.length === 0 && <p className="mt-8 flex items-center gap-2 rounded-xl border p-6"><Bell className="h-5 w-5 text-brand-600" /> This shop section is currently closed.</p>}
  </>;
}
