"use client";
// The English / Español switch on the buyer pages (George, 2026-11-10).
// The two names are written in their own language so each reader finds theirs.
import type { Lang } from "@/lib/buyer-lang";

export default function LangSwitch({
  lang,
  onChange,
  label = false,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
  /** Show "Language / Idioma" before the buttons. */
  label?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm font-semibold text-slate-700">Language / Idioma</span>}
      <div className="flex gap-1" role="group" aria-label="Language / Idioma">
        {(["en", "es"] as const).map((l) => (
          <button
            key={l}
            type="button"
            lang={l}
            aria-pressed={lang === l}
            onClick={() => onChange(l)}
            className={`px-3 py-1 rounded border text-sm ${
              lang === l ? "bg-slate-800 text-white border-slate-900" : "bg-white text-slate-700"
            }`}
          >
            {l === "en" ? "English" : "Español"}
          </button>
        ))}
      </div>
    </div>
  );
}
