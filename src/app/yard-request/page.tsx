import type { Metadata } from "next";
import { CustomerRequestStatus } from "@/components/YardTokenViews";

export const metadata: Metadata = { title: "Request status", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function YardRequestPage() { return <CustomerRequestStatus />; }
