import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/PageShell";
import CarPartsShop from "@/components/CarPartsShop";
import {
  CLOSED_CATALOG_SETTINGS,
  getCatalogSettings,
  loadShopPageCatalog,
  type ShopCategory,
  type ShopProduct,
} from "@/lib/shop-catalog";

export const metadata: Metadata = { title: "Cars & parts", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const categories: ShopCategory[] = ["all", "car", "parts-car", "part"];

export default async function ShopPage({ searchParams }: { searchParams: { category?: string } }) {
  const category = categories.includes(searchParams.category as ShopCategory)
    ? searchParams.category as ShopCategory
    : "all";
  let settings = CLOSED_CATALOG_SETTINGS;
  let settingsUnavailable = false;
  try { settings = await getCatalogSettings(); }
  catch { settingsUnavailable = true; }

  let products: ShopProduct[] = [];
  let catalogUnavailable = false;
  if (!settingsUnavailable) {
    let pageCatalog;
    try {
      pageCatalog = await loadShopPageCatalog(settings, category);
    }
    catch { catalogUnavailable = true; }
    if (pageCatalog?.notFound) notFound();
    products = pageCatalog?.products || [];
  }
  const hasLive = !settingsUnavailable && Object.values(settings.sections).some((mode) => mode === "live");

  return <main className="min-h-screen bg-zinc-50 text-zinc-900">
    <SiteHeader catalogSettings={settingsUnavailable ? null : settings} />
    {hasLive && <div className="bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-amber-950">CATALOG PREVIEW · Sandbox cart only · No real orders or charges</div>}
    <div className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Junkerz shop</p>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Cars &amp; parts</h1>
      <p className="mb-8 mt-4 max-w-2xl text-zinc-600">
        Junkerz buys junk, wrecked and non-running cars today. Online vehicle and parts listings are being introduced section by section; future parts orders will be delivery only.
      </p>
      <CarPartsShop
        key={category}
        products={products}
        settings={settings}
        settingsUnavailable={settingsUnavailable}
        unavailable={catalogUnavailable}
        initialCategory={category}
      />
    </div>
  </main>;
}
