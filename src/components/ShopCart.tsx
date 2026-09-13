"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { ShopProduct } from "@/lib/shop-catalog";

const CartContext = createContext<{ items: ShopProduct[]; add: (item: ShopProduct) => void; remove: (key: string) => void; clear: () => void } | null>(null);
export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShopProduct[]>([]);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("junkerz-sandbox-cart-v1") || "[]");
      if (Array.isArray(saved)) {
        const seen = new Set<string>();
        setItems(saved.filter((p): p is ShopProduct => {
          if (!p || !/^(car|part):[1-9]\d*$/.test(p.key) || seen.has(p.key) ||
              !["car", "part"].includes(p.kind) || typeof p.name !== "string" ||
              !Number.isSafeInteger(p.priceCents) || p.priceCents <= 0 ||
              typeof p.detail !== "string" ||
              !(p.image === null || (typeof p.image === "string" && p.image.startsWith("https://")))) return false;
          seen.add(p.key);
          return true;
        }).slice(0, 30));
      }
    } catch { /* An unavailable or invalid browser cache must not break shopping. */ }
    setRestored(true);
  }, []);
  useEffect(() => {
    if (restored) {
      try { sessionStorage.setItem("junkerz-sandbox-cart-v1", JSON.stringify(items)); }
      catch { /* Shopping still works when browser storage is disabled. */ }
    }
  }, [items, restored]);
  const clear = useCallback(() => {
    setItems([]);
    try { sessionStorage.removeItem("junkerz-sandbox-cart-v1"); } catch {}
  }, []);
  return <CartContext.Provider value={{ items,
    add: (item) => setItems((current) => current.some((p) => p.key === item.key) || current.length >= 30 ? current : [...current, item]),
    remove: (key) => setItems((current) => current.filter((p) => p.key !== key)),
    clear,
  }}>{children}</CartContext.Provider>;
}
export function useShopCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("ShopCartProvider missing");
  return context;
}
export function CartLink() {
  const { items } = useShopCart();
  return <Link href="/cart" className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-zinc-900 hover:bg-zinc-100" aria-label={`Cart (${items.length} ${items.length === 1 ? "item" : "items"})`}>
    <ShoppingCart className="h-5 w-5" aria-hidden="true" /><span>Cart</span>
    {items.length > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{items.length}</span>}
  </Link>;
}

export function ClearPaidCart() {
  const { clear } = useShopCart();
  useEffect(() => { clear(); }, [clear]);
  return null;
}
