"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import OnboardingChecklist from "@/components/buyers/OnboardingChecklist";
import { buyerApi, DocumentType, OnboardingStatus } from "@/lib/buyer-api";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText, itemLabel, serverWords } from "@/components/buyers/buyerText";

type Problem = { kind: "upload" | "terms" | "load"; code: string } | null;

export default function BuyerSignupDocuments() {
  const router = useRouter();
  // English or Español, from the switch at the top of the buyer pages (2026-11-10).
  const [lang] = useBuyerLang();
  const T = buyerText(lang);
  const t = T.documents;
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // Kept as the server's code; turned into words below so it follows the switch.
  const [error, setError] = useState<Problem>(null);
  async function reload() { setStatus(await buyerApi.onboardingStatus()); }
  useEffect(() => {
    if (!window.localStorage.getItem("buyer_token")) { router.replace("/buyers/login?signed_up=1"); return; }
    // The server checklist reads persisted documents on every visit.
    buyerApi.onboardingStatus().then(setStatus).catch(e => setError({ kind: "load", code: e?.message || "" }));
  }, [router]);
  async function upload(kind: DocumentType, file?: File) {
    if (!file) return;
    setBusy(kind); setError(null);
    try { await buyerApi.uploadDocument(kind, file); await reload(); }
    catch (e) { setError({ kind: "upload", code: (e as Error).message || "" }); }
    finally { setBusy(null); }
  }
  async function sign() {
    setBusy("terms"); setError(null);
    try { await buyerApi.signTerms(); await reload(); }
    catch (e) { setError({ kind: "terms", code: (e as Error).message || "" }); }
    finally { setBusy(null); }
  }
  const errorText = !error ? ""
    : t.server[error.code] ? t.server[error.code]
    : error.kind === "upload" ? t.uploadFailed
    : error.kind === "terms" ? t.termsFailed
    : serverWords(T, {}, error.code);
  return <main className="max-w-xl mx-auto pt-12 px-6 pb-16" lang={lang}>
    <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
    <p className="text-sm text-slate-600 mb-6">{t.intro}</p>
    {errorText && <p role="alert" className="text-red-700 mb-4">{errorText}</p>}
    {status ? <>
      <OnboardingChecklist status={status} lang={lang}/>
      <div className="space-y-4 mt-6">
        {status.items.filter(i => i.kind === "document" && (i.requested || i.required)).map(item => <div id={item.key} key={item.key} className="border rounded p-4 bg-white">
          <label htmlFor={`upload-${item.key}`} className="block font-medium mb-2">{item.completed ? t.replace(itemLabel(T, lang, item)) : t.upload(itemLabel(T, lang, item))}</label>
          <input id={`upload-${item.key}`} type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={!!busy} className="text-sm max-w-full" onChange={e => { void upload(item.key as DocumentType, e.target.files?.[0]); }}/>
          {busy === item.key && <p role="status">{t.uploading}</p>}
        </div>)}
        {!status.items.find(i => i.key === "terms")?.completed && <div id="terms" className="border rounded p-4 bg-white space-y-3">
          <p>{t.termsBefore} <a className="underline" href="/terms" target="_blank" rel="noreferrer">{t.termsLink}</a> {t.termsAfter}</p>
          <Button disabled={!!busy} onClick={sign}>{t.accept}</Button>
        </div>}
      </div>
    </> : !error && <p>{t.loadingChecklist}</p>}
    <div className="mt-8 flex flex-wrap gap-3">
      <Button onClick={() => router.replace("/buyers/dashboard")} disabled={!!busy}>{t.continue}</Button>
      <Button variant="outline" onClick={() => router.replace("/buyers/dashboard")} disabled={!!busy}>{t.skip}</Button>
    </div>
    <p className="text-xs text-slate-500 mt-3">{t.footer}</p>
  </main>;
}
