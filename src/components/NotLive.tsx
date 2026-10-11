"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import Logo from "@/components/Logo";
import { NOT_LIVE_COPY, PICKUPS_LIVE, SITE } from "@/lib/site";

const mono = "font-[family-name:var(--font-geist-mono)]";

/** Thin bar on every seller page while pickups are not live. Buyers and staff pages skip it. */
export function NotLiveBanner() {
  const path = usePathname() || "/";
  if (PICKUPS_LIVE) return null;
  if (path.startsWith("/buyers") || path.startsWith("/account") || path.startsWith("/yard-")) return null;
  const es = path.startsWith("/carro-viejos");
  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950" role="status">
      {(es ? NOT_LIVE_COPY.es : NOT_LIVE_COPY.en).banner}
    </div>
  );
}

/** Full page shown instead of the accept / book-a-pickup screens while pickups are not live. */
export function NotLiveNotice({ es = false }: { es?: boolean }) {
  const t = es ? NOT_LIVE_COPY.es : NOT_LIVE_COPY.en;
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
          <Link href="/"><Logo height={30} /></Link>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-5 py-12 text-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <p className="mt-4 text-zinc-700">{t.body}</p>
        <div className="mt-8">
          <span className="text-sm text-zinc-500">{es ? "¿Preguntas? Llámenos " : "Questions? Call us "}</span>
          <a href={SITE.phoneHref} className={`inline-flex items-center gap-1 font-bold text-zinc-900 underline ${mono}`}>
            <Phone className="h-4 w-4" /> {SITE.phone}
          </a>
        </div>
      </div>
    </main>
  );
}
