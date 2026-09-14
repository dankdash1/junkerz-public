import type { Metadata } from "next";
import { renderCatalogDetail } from "@/lib/catalog-detail-page";

export const metadata: Metadata = { title: "Vehicle details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function CarDetailPage({ params }: { params: { vin: string } }) { return renderCatalogDetail("car", params.vin); }
