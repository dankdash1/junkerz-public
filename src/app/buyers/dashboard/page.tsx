"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { buyerApi } from "@/lib/buyer-api";

interface BuyerMe {
  business_name: string;
  active: boolean;
  suspended_reason?: string;
  balance_cents: number;
  reliability?: number;
  tier?: string;
}

interface OnboardingStatus {
  w9_uploaded: boolean;
  terms_signed: boolean;
  approved: boolean;
  active: boolean;
  suspended_reason?: string;
}

export default function Dashboard() {
  const [me, setMe] = useState<BuyerMe | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    buyerApi.me().then(setMe).catch((e: Error) => setErr(e?.message ?? "load failed"));
    buyerApi.onboardingStatus().then(setOnboarding).catch(() => {});
  }, []);

  if (err) return <main className="p-12 text-red-600">{err}</main>;
  if (!me) return <main className="p-12">Loading…</main>;

  async function handleSignTerms() {
    try {
      await buyerApi.signTerms();
      const o = await buyerApi.onboardingStatus();
      setOnboarding(o);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "sign terms failed");
    }
  }

  async function handleW9Upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await buyerApi.uploadW9(f);
      const o = await buyerApi.onboardingStatus();
      setOnboarding(o);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "w9 upload failed");
    }
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{me.business_name}</h1>
        <div className="flex gap-2 text-sm">
          <a href="/buyers/marketplace" className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700">
            Marketplace
          </a>
          <a href="/buyers/won-cars" className="px-3 py-1.5 rounded border hover:bg-slate-50">
            Won cars
          </a>
          <a href="/buyers/bid-rules" className="px-3 py-1.5 rounded border hover:bg-slate-50">
            Bid rules
          </a>
        </div>
      </div>

      {!me.active && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 p-4 rounded mb-6">
          <p className="font-semibold">Account pending approval</p>
          <p className="text-sm mt-1">
            {me.suspended_reason || "Complete onboarding (W-9 + Terms) and an admin will activate your account."}
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card label="Available Balance" value={`$${(me.balance_cents / 100).toFixed(2)}`} />
        <Card label="Reliability Score" value={me.reliability?.toFixed(0) ?? "—"} />
        <Card label="Tier" value={me.tier ?? "standard"} />
      </section>

      {onboarding && !onboarding.approved && (
        <section className="bg-white rounded shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Onboarding</h2>
          <Step
            done={onboarding.terms_signed}
            label="Sign Terms of Service"
            action={
              !onboarding.terms_signed && (
                <Button onClick={handleSignTerms}>Sign</Button>
              )
            }
          />
          <Step
            done={onboarding.w9_uploaded}
            label="Upload W-9 (PDF)"
            action={
              !onboarding.w9_uploaded && (
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleW9Upload}
                  className="text-sm"
                />
              )
            }
          />
          <Step done={onboarding.approved} label="Admin approval" />
        </section>
      )}
    </main>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded shadow p-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

function Step({
  done,
  label,
  action,
}: {
  done: boolean;
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>
        <span className={done ? "text-emerald-600" : "text-slate-400"}>
          {done ? "✓" : "○"}
        </span>{" "}
        {label}
      </span>
      <span>{action}</span>
    </div>
  );
}
