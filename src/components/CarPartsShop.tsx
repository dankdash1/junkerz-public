"use client";

import { useState } from "react";
import Link from "next/link";
import { CarFront, Package, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopCart } from "@/components/ShopCart";
import type { ShopProduct } from "@/lib/shop-catalog";

export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

export default function CarPartsShop({ products, unavailable, initialCategory = "all" }: { products: ShopProduct[]; unavailable: boolean; initialCategory?: string }) {
  const [filter, setFilter] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const { items, add } = useShopCart();
  const shown = products.filter((p) => (filter === "all" || p.kind === filter) && `${p.name} ${p.detail}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="flex flex-col justify-between gap-4 sm:flex-row">
      <div className="flex gap-2" aria-label="Catalog categories">
        {[["all", "All"], ["car", "Cars"], ["part", "Parts"]].map(([value, label]) => <Button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)} variant={filter === value ? "default" : "outline"} className="h-11 px-5">{label}</Button>)}
      </div>
      <input aria-label="Search cars and parts" type="search" placeholder="Search cars, parts, make or model" value={search} onChange={(e) => setSearch(e.target.value)} className="min-h-11 rounded-lg border border-zinc-300 px-4 sm:w-80" />
    </div>
    {unavailable ? <p role="alert" className="mt-8 rounded-xl bg-amber-50 p-6">The catalog is temporarily unavailable. Please refresh to try again.</p> : <>
      <p className="my-5 text-sm text-zinc-500">{shown.length} listings · Availability must be confirmed before real sales.</p>
      {shown.length === 0 && <p className="rounded-xl border p-8">No matching listings. Try another search or category.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((product) => {
          const added = items.some((p) => p.key === product.key);
          return <article key={product.key} className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="relative flex aspect-[4/3] items-center justify-center bg-zinc-100">
              {product.image ? <img src={product.image} alt={product.name} className="h-full w-full object-cover" loading="lazy" /> : product.kind === "car" ? <CarFront className="h-16 w-16 text-zinc-300" aria-hidden="true" /> : <Package className="h-16 w-16 text-zinc-300" aria-hidden="true" />}
              <span className="absolute left-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">SANDBOX LISTING</span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{product.kind === "car" ? "Car" : "Part"}</p>
              <h2 className="mt-2 text-lg font-bold">{product.name}</h2>
              <p className="mt-2 text-sm text-zinc-500">{product.detail}</p>
              <p className="mb-4 mt-5 text-2xl font-extrabold">{product.priceCents === null ? "Price needed" : money(product.priceCents)}</p>
              <Button className="mt-auto h-11 w-full gap-2" disabled={added || product.priceCents === null || items.length >= 30} onClick={() => add(product)}>
                {added ? <><ShoppingCart className="h-4 w-4" /> In cart</> : <><Plus className="h-4 w-4" /> Add to cart</>}
              </Button>
            </div>
          </article>;
        })}
      </div>
    </>}
    {items.length > 0 && <div className="sticky bottom-5 mt-6 flex items-center justify-between gap-4 rounded-xl bg-zinc-900 px-5 py-4 text-white shadow-xl" role="status">
      <span>{items.length} {items.length === 1 ? "item" : "items"} in your cart</span>
      <Link href="/cart" className="rounded-lg bg-white px-4 py-2 font-bold text-zinc-900">View cart →</Link>
    </div>}
  </>;
}
