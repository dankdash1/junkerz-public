"use client";
import { useEffect, useState } from "react";
import OnboardingChecklist from "@/components/buyers/OnboardingChecklist";
import { buyerApi, OnboardingStatus } from "@/lib/buyer-api";

interface BuyerMe {
  business_name: string;
  active: boolean;
  suspended_reason?: string;
  balance_cents: number;
  reliability?: number;
  tier?: string;
}

export default function Dashboard() {
  const [me, setMe] = useState<BuyerMe | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    buyerApi.me().then(setMe).catch((e: Error) => setErr(e?.message ?? "load failed"));
    buyerApi.onboardingStatus().then(setOnboarding).catch((e: Error) => setErr(e.message || "Unable to load onboarding"));
  }, []);

  if (err) return <main className="p-12 text-red-600">{err}</main>;
  if (!me) return <main className="p-12">Loading…</main>;

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{me.business_name}</h1>
        <div className="flex gap-2 text-sm">
          <a href="/buyers/marketplace" className="px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700">
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

      <p className="text-sm mb-5">Set up your <a href="/buyers/settings" className="text-brand-700 underline">payment method</a> for pickup finder fees.</p>

      {!me.active && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 p-4 rounded mb-6">
          <p className="font-semibold">Account pending approval</p>
          <p className="text-sm mt-1">
            {me.suspended_reason || "Complete the required checklist items so staff can review your account."}
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card label="Available Balance" value={`$${(me.balance_cents / 100).toFixed(2)}`} />
        <Card label="Reliability Score" value={me.reliability?.toFixed(0) ?? "—"} />
        <Card label="Tier" value={me.tier ?? "standard"} />
      </section>

      {onboarding && <OnboardingChecklist status={onboarding} />}
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
