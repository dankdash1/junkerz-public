"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const PUBLIC_PATHS = ["/buyers/login", "/buyers/signup"];

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

  // Show empty placeholder while we decide whether to render
  if (!ready) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const showNav = !PUBLIC_PATHS.includes(pathname);

  return (
    <div className="min-h-screen bg-slate-50">
      {showNav && (
        <nav className="bg-slate-900 text-white p-3 flex gap-4 text-sm">
          <Link href="/buyers/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/buyers/bid-rules" className="hover:underline">
            Bid Rules
          </Link>
          <Link href="/buyers/won-cars" className="hover:underline">
            Won Cars
          </Link>
          <Link href="/buyers/ledger" className="hover:underline">
            Ledger
          </Link>
          <Link href="/buyers/disputes" className="hover:underline">
            Disputes
          </Link>
          <button
            className="ml-auto hover:underline"
            onClick={() => {
              window.localStorage.removeItem("buyer_token");
              router.replace("/buyers/login");
            }}
          >
            Sign Out
          </button>
        </nav>
      )}
      {children}
    </div>
  );
}
