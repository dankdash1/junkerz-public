"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import OnboardingChecklist from "@/components/buyers/OnboardingChecklist";
import { buyerApi, DocumentType, OnboardingStatus } from "@/lib/buyer-api";

export default function BuyerSignupDocuments() {
  const router = useRouter();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function reload() { setStatus(await buyerApi.onboardingStatus()); }
  useEffect(() => {
    if (!window.localStorage.getItem("buyer_token")) { router.replace("/buyers/login?signed_up=1"); return; }
    // The server checklist reads persisted documents on every visit.
    buyerApi.onboardingStatus().then(setStatus).catch(e => setError(e.message));
  }, [router]);
  async function upload(kind: DocumentType, file?: File) {
    if (!file) return;
    setBusy(kind); setError("");
    try { await buyerApi.uploadDocument(kind, file); await reload(); }
    catch (e) { setError((e as Error).message || "Upload failed"); }
    finally { setBusy(null); }
  }
  async function sign() {
    setBusy("terms"); setError("");
    try { await buyerApi.signTerms(); await reload(); }
    catch (e) { setError((e as Error).message || "Could not save acceptance"); }
    finally { setBusy(null); }
  }
  return <main className="max-w-xl mx-auto pt-12 px-6 pb-16">
    <h1 className="text-2xl font-bold mb-2">Upload your documents</h1>
    <p className="text-sm text-slate-600 mb-6">Complete required items for staff approval. PDF, PNG or JPG files up to 10 MB.</p>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
    {status ? <>
      <OnboardingChecklist status={status}/>
      <div className="space-y-4 mt-6">
        {status.items.filter(i => i.kind === "document" && (i.requested || i.required)).map(item => <div id={item.key} key={item.key} className="border rounded p-4 bg-white">
          <label htmlFor={`upload-${item.key}`} className="block font-medium mb-2">{item.completed ? 'Replace' : 'Upload'} {item.label}</label>
          <input id={`upload-${item.key}`} type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={!!busy} className="text-sm max-w-full" onChange={e => { void upload(item.key as DocumentType, e.target.files?.[0]); }}/>
          {busy === item.key && <p role="status">Uploading…</p>}
        </div>)}
        {!status.items.find(i => i.key === "terms")?.completed && <div id="terms" className="border rounded p-4 bg-white space-y-3">
          <p>Read the <a className="underline" href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> before accepting.</p>
          <Button disabled={!!busy} onClick={sign}>I accept the Terms of Service</Button>
        </div>}
      </div>
    </> : !error && <p>Loading saved checklist…</p>}
    <div className="mt-8 flex flex-wrap gap-3">
      <Button onClick={() => router.replace("/buyers/dashboard")} disabled={!!busy}>Continue to dashboard</Button>
      <Button variant="outline" onClick={() => router.replace("/buyers/dashboard")} disabled={!!busy}>Skip for now</Button>
    </div>
    <p className="text-xs text-slate-500 mt-3">Your saved progress stays on your dashboard. Return to any incomplete item there.</p>
  </main>;
}
