"use client";
// The buyer's language: English or Español (George, 2026-11-09).
// Picked at sign-up and saved on the buyer record (junkyard_clients.preferred_language).
// The bid-rule form follows it. This browser keeps a copy so the page opens in the
// right language before the account answers.
import { useCallback, useEffect, useRef, useState } from "react";
import { buyerApi } from "@/lib/buyer-api";

export type Lang = "en" | "es";
const KEY = "buyer_lang";

export function asLang(v: unknown): Lang {
  return v === "es" ? "es" : "en";
}

export function storedLang(): Lang {
  try {
    return asLang(window.localStorage.getItem(KEY));
  } catch {
    return "en";
  }
}

export function rememberLang(lang: Lang) {
  try {
    window.localStorage.setItem(KEY, lang);
  } catch {
    /* private window: the account copy still holds it */
  }
}

/** [lang, setLang]. setLang also saves the choice to the buyer's account. */
export function useBuyerLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>("en");
  const chose = useRef(false);

  useEffect(() => {
    setLangState(storedLang());
    let live = true;
    Promise.resolve()
      .then(() => buyerApi.me())
      .then((me: { preferred_language?: string } | undefined) => {
        if (!live || chose.current || !me?.preferred_language) return;
        const l = asLang(me.preferred_language);
        setLangState(l);
        rememberLang(l);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const setLang = useCallback((l: Lang) => {
    chose.current = true;
    setLangState(l);
    rememberLang(l);
    Promise.resolve()
      .then(() => buyerApi.setLanguage(l))
      .catch(() => {});
  }, []);

  return [lang, setLang];
}
