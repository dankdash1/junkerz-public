"use client";
// The buyer's language: English or Español (George, 2026-11-09).
// Picked at sign-up and saved on the buyer record (junkyard_clients.preferred_language).
// This browser keeps a copy so the page opens in the right language before the
// account answers.
//
// 2026-11-10 (George): the switch now changes the WHOLE buyer side, not just the
// bid-rule form. The buyers layout holds one shared choice (BuyerLangProvider) so
// the switch at the top and every page under it move together.
// Which language a page opens in:
//   1. ?lang=es / ?lang=en in the address (outreach links) — wins and is remembered
//   2. the choice this browser remembered
//   3. Spanish if the browser's own language starts with "es"
//   4. English
// Once logged in, the account's saved language replaces 2-4 unless the buyer has
// already picked one on this visit.
import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { buyerApi } from "@/lib/buyer-api";

export type Lang = "en" | "es";
const KEY = "buyer_lang";

export function asLang(v: unknown): Lang {
  return v === "es" ? "es" : "en";
}

function exactLang(v: unknown): Lang | null {
  return v === "es" || v === "en" ? v : null;
}

/** The remembered choice, or null when this browser has none. */
export function savedLang(): Lang | null {
  try {
    return exactLang(window.localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

export function storedLang(): Lang {
  return savedLang() ?? "en";
}

export function rememberLang(lang: Lang) {
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* private window: the account copy still holds it */
  }
}

/** ?lang=es or ?lang=en in the address, else null. */
export function urlLang(): Lang | null {
  try {
    const v = new URLSearchParams(window.location.search).get("lang");
    return exactLang(v?.trim().toLowerCase());
  } catch {
    return null;
  }
}

/** "es" when the browser's first language is Spanish (es, es-MX, es-US...), else null. */
export function browserLang(): Lang | null {
  try {
    const first = (navigator.languages && navigator.languages[0]) || navigator.language || "";
    return first.toLowerCase().startsWith("es") ? "es" : null;
  } catch {
    return null;
  }
}

/** The language a page should open in before the account answers. */
export function openingLang(): Lang {
  return urlLang() ?? savedLang() ?? browserLang() ?? "en";
}

type LangPair = [Lang, (l: Lang) => void];

/**
 * account: the visitor is logged in, so read the account's language and save
 * choices to it. Public pages (sign-up, login, recover) pass false: calling the
 * account there would bounce a visitor with no login to the login page.
 * off: another copy (the layout's) is in charge; do nothing.
 */
function useLangState(account: boolean, off = false): LangPair {
  const [lang, setLangState] = useState<Lang>("en");
  const chose = useRef(false);
  const current = useRef<Lang>("en");
  const acct = useRef(account);
  acct.current = account;

  useEffect(() => {
    if (off) return;
    const fromUrl = urlLang();
    const l = fromUrl ?? savedLang() ?? browserLang() ?? "en";
    current.current = l;
    setLangState(l);
    if (fromUrl) {
      // An outreach link picked the language: it counts as the buyer's choice.
      chose.current = true;
      rememberLang(fromUrl);
    }
  }, [off]);

  useEffect(() => {
    if (off || !account) return;
    let live = true;
    if (chose.current) {
      // Picked before logging in (or by the link): put it on the account.
      Promise.resolve()
        .then(() => buyerApi.setLanguage(current.current))
        .catch(() => {});
      return;
    }
    Promise.resolve()
      .then(() => buyerApi.me())
      .then((me: { preferred_language?: string } | undefined) => {
        if (!live || chose.current || !me?.preferred_language) return;
        const l = asLang(me.preferred_language);
        current.current = l;
        setLangState(l);
        rememberLang(l);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [account, off]);

  const setLang = useCallback((l: Lang) => {
    chose.current = true;
    current.current = l;
    setLangState(l);
    rememberLang(l);
    if (!acct.current) return;
    Promise.resolve()
      .then(() => buyerApi.setLanguage(l))
      .catch(() => {});
  }, []);

  return [lang, setLang];
}

const BuyerLangContext = createContext<LangPair | null>(null);

/** One shared language for every buyer page under it (used by the buyers layout). */
export function BuyerLangProvider({ account, children }: { account: boolean; children?: ReactNode }) {
  const pair = useLangState(account);
  return createElement(BuyerLangContext.Provider, { value: pair }, children);
}

/** True when a BuyerLangProvider above already shows the language switch. */
export function useInBuyerLangProvider(): boolean {
  return useContext(BuyerLangContext) != null;
}

/**
 * [lang, setLang]. Inside the buyers layout this is the shared choice. Used on
 * its own (tests, or a page outside the layout) it keeps its own copy; pass
 * { account: false } on pages a logged-out visitor sees.
 * setLang also saves the choice to the buyer's account when logged in.
 */
export function useBuyerLang(opts?: { account?: boolean }): LangPair {
  const shared = useContext(BuyerLangContext);
  const own = useLangState(opts?.account ?? true, shared != null);
  return shared ?? own;
}
