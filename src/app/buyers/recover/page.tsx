"use client";
import { useEffect, useState } from "react";
import { buyerApi } from "@/lib/buyer-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText } from "@/components/buyers/buyerText";

export default function BuyerRecovery() {
  // English or Español, from the switch at the top of the buyer pages (2026-11-10).
  const [lang] = useBuyerLang({ account: false });
  const t = buyerText(lang).recover;
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Kept as keys/codes and turned into words below, so they follow the switch.
  const [message, setMessage] = useState<"" | "sent" | "updated">("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    setToken(value);
    if (value) window.history.replaceState({}, "", window.location.pathname);
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      if (token) {
        await buyerApi.consumeRecovery(token, password);
        window.localStorage.removeItem("buyer_token");
        setComplete(true); setPassword(""); setToken("");
        setMessage("updated");
      } else {
        // The server always answers with the same sentence, whether or not the
        // account exists; we show it in the page's language.
        await buyerApi.requestRecovery(email);
        setMessage("sent");
      }
    } catch (e) { setError((e as Error).message || "recovery_unavailable"); }
    finally { setBusy(false); }
  }
  const messageText = message === "sent" ? t.sent : message === "updated" ? t.updated : "";
  // Unknown codes ("HTTP 500", "Failed to fetch") read as "Recovery is unavailable".
  const errorText = error ? (t.server[error] ?? t.unavailable) : "";
  return <main className="max-w-sm mx-auto px-6 py-16" lang={lang}>
    <h1 className="text-2xl font-bold mb-4">{t.title}</h1>
    <p className="text-sm mb-6">{t.intro}</p>
    {!complete && <form onSubmit={submit} className="space-y-4">
      {token ? <div><label htmlFor="new-password">{t.newPassword}</label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)}/></div>
        : <div><label htmlFor="recovery-email">{t.loginEmail}</label><Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></div>}
      <Button disabled={busy} type="submit">{busy ? t.wait : token ? t.reset : t.send}</Button>
    </form>}
    {messageText && <p role="status" className="mt-4">{messageText}</p>}
    {errorText && <p role="alert" className="mt-4 text-red-700">{errorText}. <a className="underline" href="/buyers/recover">{t.requestNew}</a></p>}
    <p className="mt-6"><a className="underline" href="/buyers/login">{t.back}</a></p>
  </main>;
}
