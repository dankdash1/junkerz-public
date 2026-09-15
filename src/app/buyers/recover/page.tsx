"use client";
import { useEffect, useState } from "react";
import { buyerApi } from "@/lib/buyer-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BuyerRecovery() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
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
        setMessage("Password updated. Sign in with your new password.");
      } else {
        const result = await buyerApi.requestRecovery(email);
        setMessage(result.message);
      }
    } catch (e) { setError((e as Error).message || "Recovery is unavailable. Try again."); }
    finally { setBusy(false); }
  }
  return <main className="max-w-sm mx-auto px-6 py-16">
    <h1 className="text-2xl font-bold mb-4">Recover your buyer account</h1>
    <p className="text-sm mb-6">Use your commercial buyer login email. Recovery links expire after 15 minutes and work once.</p>
    {!complete && <form onSubmit={submit} className="space-y-4">
      {token ? <div><label htmlFor="new-password">New password</label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)}/></div>
        : <div><label htmlFor="recovery-email">Login email</label><Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)}/></div>}
      <Button disabled={busy} type="submit">{busy ? 'Please wait…' : token ? 'Reset password' : 'Send recovery email'}</Button>
    </form>}
    {message && <p role="status" className="mt-4">{message}</p>}
    {error && <p role="alert" className="mt-4 text-red-700">{error}. <a className="underline" href="/buyers/recover">Request a new link</a></p>}
    <p className="mt-6"><a className="underline" href="/buyers/login">Back to buyer login</a></p>
  </main>;
}
