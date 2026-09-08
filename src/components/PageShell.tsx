import Link from "next/link";
import Logo from "@/components/Logo";
import { BadgeDollarSign, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";
import { SiteFooter } from "@/app/page";

const mono = "font-[family-name:var(--font-geist-mono)]";

export function SiteHeader({ ctaLabel = "Get my offer" }: { ctaLabel?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <Logo height={34} priority />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 lg:flex">
          <Link href="/junk-cars" className="hover:text-zinc-900">Wrecked cars</Link>
          <Link href="/not-running" className="hover:text-zinc-900">Not running</Link>
          <Link href="/about-us" className="hover:text-zinc-900">About</Link>
          <Link href="/carro-viejos" className="hover:text-zinc-900">Español</Link>
        </nav>
        <div className="flex items-center gap-3">
          <a href={SITE.phoneHref}
             className={`hidden items-center gap-1.5 text-sm font-bold text-zinc-800 hover:text-brand-700 sm:flex ${mono}`}>
            <Phone className="h-4 w-4" /> {SITE.phone}
          </a>
          <Link href="/quote">
            <Button className="h-10 px-4 font-semibold">{ctaLabel}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Bottom call-to-action used on every content page. */
export function BottomCTA({
  heading, body, cta = "Get my offer", callLabel = "Or call",
}: { heading: string; body: string; cta?: string; callLabel?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16">
      <div className="rounded-3xl bg-brand-600 px-8 py-12 text-white md:px-14 md:py-14">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-xl">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight">{heading}</h2>
            <p className="mt-3 text-brand-50">{body}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <Link href="/quote">
              <Button className="h-14 w-full gap-2 bg-white px-8 text-base font-bold text-brand-700 hover:bg-brand-50 sm:w-auto">
                {cta} <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href={SITE.phoneHref}>
              <Button variant="outline"
                className="h-14 w-full gap-2 border-white/40 bg-transparent px-6 text-base font-bold text-white hover:bg-white/10 sm:w-auto">
                <Phone className="h-4 w-4" /> {callLabel} {SITE.phone}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PageShell({
  eyebrow, title, lede, children,
}: {
  eyebrow: string; title: string; lede: string; children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <SiteHeader />
      <section className="border-b border-zinc-100">
        <div className="mx-auto max-w-3xl px-5 py-14 md:py-20">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 ${mono}`}>
            {eyebrow}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-lg text-zinc-600">{lede}</p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-5 py-12">{children}</div>
      <SiteFooter />
    </main>
  );
}

export { SiteFooter };
