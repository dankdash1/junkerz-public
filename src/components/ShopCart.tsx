"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import type { ShopProduct } from "@/lib/shop-catalog";

const CartContext = createContext<{ items: ShopProduct[]; add: (item: ShopProduct) => void; remove: (key: string) => void; clear: () => void } | null>(null);
export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShopProduct[]>([]);
  return <CartContext.Provider value={{ items,
    add: (item) => setItems((current) => current.some((p) => p.key === item.key) || current.length >= 30 ? current : [...current, item]),
    remove: (key) => setItems((current) => current.filter((p) => p.key !== key)),
    clear: () => setItems([]),
  }}>{children}</CartContext.Provider>;
}
export function useShopCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("ShopCartProvider missing");
  return context;
}
export function CartLink() {
  const { items } = useShopCart();
  return <Link href="/cart" className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-zinc-900 hover:bg-zinc-100" aria-label={`Cart (${items.length} items)`}>
    <ShoppingCart className="h-5 w-5" aria-hidden="true" /><span>Cart</span>
    {items.length > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-xs text-white">{items.length}</span>}
  </Link>;
}
