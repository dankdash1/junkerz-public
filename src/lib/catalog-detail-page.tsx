import { notFound } from "next/navigation";
import CatalogDetail from "@/components/CatalogDetail";
import { getCatalogDetail, getCatalogSettings, type ShopProductKind } from "@/lib/shop-catalog";
import { getYardRequestSettings } from "@/lib/yard-requests";

export async function renderCatalogDetail(kind: ShopProductKind, identifier: string) {
  let settings;
  try { settings = await getCatalogSettings(); } catch { notFound(); }
  const product = await getCatalogDetail(settings, kind, identifier);
  if (!product) notFound();
  let requestIntakeEnabled = false;
  try { requestIntakeEnabled = (await getYardRequestSettings()).enabled; } catch {}
  return <CatalogDetail product={product} settings={settings} requestIntakeEnabled={requestIntakeEnabled} />;
}
