"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { BuyerLangProvider, useBuyerLang } from "@/lib/buyer-lang";
import LangSwitch from "@/components/buyers/LangSwitch";
import { buyerText } from "@/components/buyers/buyerText";

const PUBLIC_PATHS = ["/buyers/login", "/buyers/signup", "/buyers/recover"];

export default function BuyersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.localStorage.getItem("buyer_token");
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!t && !isPublic) {
      router.replace("/buyers/login");
      return;
    }
    setReady(true);
  }, [pathname, router]);

  const isPublic = PUBLIC_PATHS.includes(pathname);

  // 2026-11-10 (George): one English / Español choice for every buyer page.
  // Public pages (sign-up, login, recover) never ask the account: a visitor with
  // no login would be bounced to the login page.
  return (
    <BuyerLangProvider account={ready && !isPublic}>
      {ready ? <Shell showNav={!isPublic}>{children}</Shell> : <div className="min-h-screen bg-slate-50" />}
    </BuyerLangProvider>
  );
}

function Shell({ showNav, children }: { showNav: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [lang, setLang] = useBuyerLang();
  const t = buyerText(lang).nav;

  return (
    <div className="min-h-screen bg-slate-50" lang={lang}>
      {/* The language switch sits at the very top of every buyer page. */}
      <div className="flex justify-end border-b border-slate-200 bg-white px-3 py-2">
        <LangSwitch lang={lang} onChange={setLang} label />
      </div>
      {showNav && (
        <nav className="bg-slate-900 text-white p-3 flex flex-wrap gap-4 text-sm">
          <Link href="/buyers/dashboard" className="hover:underline">
            {t.dashboard}
          </Link>
          <Link href="/buyers/bid-rules" className="hover:underline">
            {t.bidRules}
          </Link>
          <Link href="/buyers/won-cars" className="hover:underline">
            {t.wonCars}
          </Link>
          <Link href="/buyers/ledger" className="hover:underline">
            {t.ledger}
          </Link>
          <Link href="/buyers/disputes" className="hover:underline">
            {t.disputes}
          </Link>
          <Link href="/buyers/settings" className="hover:underline">{t.settings}</Link>
          <button
            className="ml-auto hover:underline"
            onClick={() => {
              window.localStorage.removeItem("buyer_token");
              router.replace("/buyers/login");
            }}
          >
            {t.signOut}
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}
