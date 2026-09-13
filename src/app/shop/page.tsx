import type { Metadata } from "next";
import { SiteHeader } from "@/components/PageShell";
import CarPartsShop from "@/components/CarPartsShop";
import { getShopCatalog, type ShopProduct } from "@/lib/shop-catalog";

export const metadata: Metadata = { title: "Cars & parts — sandbox shop", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ShopPage() {
  let products: ShopProduct[] = [];
  let unavailable = false;
  try { products = await getShopCatalog(); } catch { unavailable = true; }
  return <main className="min-h-screen bg-zinc-50 text-zinc-900">
    <SiteHeader />
    <div className="bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-amber-950">SANDBOX SHOP · Test checkout only · No real orders or charges</div>
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Junkerz shop</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Cars &amp; parts</h1>
      <p className="mb-8 mt-4 max-w-2xl text-zinc-600">Browse the catalog, add cars and parts to your cart, and try checkout. These listings are for testing; prices and availability are not confirmed for purchase.</p>
      <CarPartsShop products={products} unavailable={unavailable} />
    </div>
  </main>;
}
