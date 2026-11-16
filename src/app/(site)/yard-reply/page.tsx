import type { Metadata } from "next";
import { SupplierReplyPanel } from "@/components/YardTokenViews";

export const metadata: Metadata = { title: "Yard reply", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function YardReplyPage() { return <SupplierReplyPanel />; }
