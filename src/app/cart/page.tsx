import type { Metadata } from "next";
import { SiteHeader } from "@/components/PageShell";
import { CLOSED_CATALOG_SETTINGS, getCatalogSettings } from "@/lib/shop-catalog";
import CartContents from "./CartContents";

export const metadata: Metadata = { title: "Your cart — cars & parts", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  let settings = CLOSED_CATALOG_SETTINGS;
  let settingsUnavailable = false;
  try { settings = await getCatalogSettings(); }
  catch { settingsUnavailable = true; }
  return <main className="min-h-screen bg-zinc-50 text-zinc-900">
    <SiteHeader catalogSettings={settingsUnavailable ? null : settings} />
    <div className="mx-auto max-w-6xl px-5 py-10"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Junkerz · Cars &amp; parts</p><h1 className="text-4xl font-extrabold tracking-tight">Your cart</h1><CartContents settings={settings} settingsUnavailable={settingsUnavailable} /></div>
  </main>;
}
