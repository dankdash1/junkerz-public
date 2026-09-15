import Link from "next/link";
import { CarFront, ChevronLeft, Package, ShieldCheck, Truck } from "lucide-react";
import { SiteHeader } from "@/components/PageShell";
import YardRequestForm from "@/components/YardRequestForm";
import { money } from "@/components/CarPartsShop";
import type { CatalogSettings, ShopProduct } from "@/lib/shop-catalog";

export default function CatalogDetail({ product, settings, requestIntakeEnabled }: { product: ShopProduct; settings: CatalogSettings; requestIntakeEnabled: boolean }) {
  const Icon = product.kind === "part" ? Package : CarFront;
  const requestKind = product.kind === "parts-car" ? "donor_part" : product.kind === "car" ? "whole_car" : "part";
  return <main className="min-h-screen bg-zinc-50 text-zinc-900">
    <SiteHeader catalogSettings={settings} showCart={!requestIntakeEnabled} />
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-zinc-600 hover:text-brand-700"><ChevronLeft className="h-4 w-4" /> Back to cars &amp; parts</Link>
      <div className="mt-5 grid overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-72 items-center justify-center bg-zinc-100 lg:min-h-[34rem]">
          {product.image ? <img src={product.image} alt={product.name} className="h-full max-h-[42rem] w-full object-cover" /> : <Icon className="h-24 w-24 text-zinc-300" aria-hidden="true" />}
        </div>
        <div className="flex flex-col p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{product.kind === "part" ? "Individual part" : product.kind === "parts-car" ? "Donor vehicle" : "Complete vehicle"}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-zinc-600">{product.detail}</p>
          {product.mileage != null && <p className="mt-3 text-sm font-semibold text-zinc-600">{product.mileage.toLocaleString()} recorded miles</p>}
          {product.condition && <p className="mt-3 text-sm font-semibold capitalize text-zinc-600">Condition: {product.condition}</p>}
          <p className="mt-7 text-3xl font-extrabold">{product.priceCents == null ? "Price requires confirmation" : money(product.priceCents)}</p>
          <div className="mt-7 space-y-3">
            {requestIntakeEnabled ? <YardRequestForm target={{ kind: requestKind, carId: product.carId, partId: product.kind === "part" ? product.id : undefined, label: product.name }} /> : <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">Online stock requests are currently paused. Call Junkerz for help.</p>}
          </div>
          <div className="mt-8 space-y-3 border-t border-zinc-200 pt-6 text-sm text-zinc-600">
            <p className="flex gap-3"><ShieldCheck className="h-5 w-5 shrink-0 text-brand-600" /> Availability, condition, fitment, and final customer price are confirmed before an order is created.</p>
            <p className="flex gap-3"><Truck className="h-5 w-5 shrink-0 text-brand-600" /> Parts are delivery only. Collection is arranged with the verified stock holder after payment and readiness.</p>
          </div>
        </div>
      </div>
    </div>
  </main>;
}
