"use client";
import Link from "next/link";
import { Phone, ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { track } from "@/components/Analytics";

/**
 * Google's note: up to 98% of junk-car traffic is on a phone, and the Call
 * and Get Quote buttons should be reachable at all times rather than only
 * at the top of the page. Phone calls are usually the cheapest, highest
 * converting lead in this industry, so the call is given equal weight.
 *
 * Hidden on desktop, where the header is already always visible.
 */
export default function StickyMobileBar({ es = false }: { es?: boolean }) {
  const quoteHref = es ? "/quote?lang=es" : "/quote";
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 p-2.5 shadow-[0_-8px_24px_-12px_rgba(0,0,0,.25)] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        <a
          href={SITE.phoneHref}
          onClick={() => track("call_click", { source: "sticky_bar" })}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white text-[15px] font-bold text-zinc-900"
        >
          <Phone className="h-4 w-4" />
          {es ? "Llamar" : "Call"}
        </a>
        <Link
          href={quoteHref}
          onClick={() => track("quote_start", { source: "sticky_bar" })}
          className="flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-xl bg-brand-600 text-[15px] font-bold text-white"
        >
          {es ? "Ver mi oferta" : "Get my offer"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
