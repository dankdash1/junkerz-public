import type { Metadata } from "next";
import { renderCatalogDetail } from "@/lib/catalog-detail-page";

export const metadata: Metadata = { title: "Donor vehicle details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function DonorDetailPage({ params }: { params: { vin: string } }) { return renderCatalogDetail("parts-car", params.vin); }
