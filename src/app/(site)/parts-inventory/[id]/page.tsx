import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderCatalogDetail } from "@/lib/catalog-detail-page";

export const metadata: Metadata = { title: "Part details", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function PartDetailPage({ params }: { params: { id: string } }) {
  if (!/^[1-9]\d*$/.test(params.id)) notFound();
  return renderCatalogDetail("part", params.id);
}
