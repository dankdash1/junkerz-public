import type { Metadata } from "next";
import { SiteHeader } from "@/components/PageShell";
import CartContents from "./CartContents";

export const metadata: Metadata = { title: "Your cart — cars & parts", robots: { index: false, follow: false } };
export default function CartPage() {
  return <main className="min-h-screen bg-zinc-50 text-zinc-900">
    <SiteHeader />
    <div className="bg-amber-100 px-5 py-3 text-center text-sm font-semibold text-amber-950">SANDBOX CART · No real orders or charges</div>
    <div className="mx-auto max-w-5xl px-5 py-10"><h1 className="text-4xl font-extrabold tracking-tight">Your cart</h1><CartContents /></div>
  </main>;
}
