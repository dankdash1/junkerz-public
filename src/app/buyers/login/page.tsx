"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";

export default function BuyerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await buyerApi.login(email, pw);
      if (!r.token) throw new Error("Login failed");
      window.localStorage.setItem("buyer_token", r.token);
      router.replace("/buyers/dashboard");
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto pt-24 px-6">
      <h1 className="text-2xl font-bold mb-6">Junkerz Buyer Login</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <Button className="w-full" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="text-sm mt-6 text-center">
        New buyer?{" "}
        <a className="underline" href="/buyers/signup">
          Create an account
        </a>
      </p>
    </main>
  );
}
