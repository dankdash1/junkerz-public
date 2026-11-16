"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText, serverWords } from "@/components/buyers/buyerText";

export default function BuyerLogin() {
  const router = useRouter();
  // English or Español, from the switch at the top of the buyer pages (2026-11-10).
  const [lang] = useBuyerLang({ account: false });
  const T = buyerText(lang);
  const t = T.login;
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  // The server's error code; turned into words below so it follows the switch.
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await buyerApi.login(email, pw);
      if (!r.token) throw new Error("login_failed");
      window.localStorage.setItem("buyer_token", r.token);
      router.replace("/buyers/dashboard");
    } catch (e: unknown) {
      setErr((e as Error)?.message || "login_failed");
    } finally {
      setBusy(false);
    }
  }

  const errText = err ? serverWords(T, { ...t.server, login_failed: t.failed }, err) : null;

  return (
    <main className="max-w-sm mx-auto pt-24 px-6" lang={lang}>
      <h1 className="text-2xl font-bold mb-6">{t.title}</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>{t.email}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>{t.password}</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        {errText && <p className="text-red-600 text-sm">{errText}</p>}
        <Button className="w-full" type="submit" disabled={busy}>
          {busy ? t.signingIn : t.signIn}
        </Button>
      </form>
      <p className="text-sm mt-4 text-center"><a className="underline" href="/buyers/recover">{t.forgot}</a></p>
      <p className="text-sm mt-6 text-center">
        {t.newBuyer}{" "}
        <a className="underline" href="/buyers/signup">
          {t.create}
        </a>
      </p>
    </main>
  );
}
