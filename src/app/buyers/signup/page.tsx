"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";

export default function BuyerSignup() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", business_name: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await buyerApi.signup(form);
      setDone(true);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <main className="max-w-md mx-auto pt-24 px-6 text-center space-y-4">
        <h1 className="text-2xl font-bold">Account created</h1>
        <p className="text-slate-700">
          Your account is pending admin approval. Sign in to complete onboarding (W-9 upload + Terms).
        </p>
        <Button onClick={() => router.replace("/buyers/login")}>
          Continue to Sign In
        </Button>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto pt-16 px-6">
      <h1 className="text-2xl font-bold mb-6">Create Junkerz Buyer Account</h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label>Business Name</Label>
          <Input
            value={form.business_name}
            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <Button className="w-full" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create Account"}
        </Button>
      </form>
    </main>
  );
}
