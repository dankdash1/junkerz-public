"use client";
import { useEffect, useState } from "react";
import OnboardingChecklist from "@/components/buyers/OnboardingChecklist";
import { buyerApi, OnboardingStatus } from "@/lib/buyer-api";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText, serverWords } from "@/components/buyers/buyerText";

interface BuyerMe {
  business_name: string;
  active: boolean;
  suspended_reason?: string;
  balance_cents: number;
  reliability?: number;
  tier?: string;
}

export default function Dashboard() {
  // English or Español, from the switch at the top of the buyer pages (2026-11-10).
  const [lang] = useBuyerLang();
  const T = buyerText(lang);
  const t = T.dashboard;
  const [me, setMe] = useState<BuyerMe | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingStatus | null>(null);
  // Kept as the server's code; turned into words below so it follows the switch.
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    buyerApi.me().then(setMe).catch((e: Error) => setErr(e?.message || "load_failed"));
    buyerApi.onboardingStatus().then(setOnboarding).catch((e: Error) => setErr(e?.message || "load_failed"));
  }, []);

  if (err) return <main className="p-12 text-red-600" lang={lang}>{serverWords(T, {}, err)}</main>;
  if (!me) return <main className="p-12" lang={lang}>{T.loading}</main>;

  const tier = me.tier ?? "standard";

  return (
    <main className="p-6 max-w-4xl mx-auto" lang={lang}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{me.business_name}</h1>
        <div className="flex gap-2 text-sm">
          <a href="/buyers/marketplace" className="px-3 py-1.5 rounded bg-brand-600 text-white hover:bg-brand-700">
            {t.marketplace}
          </a>
          <a href="/buyers/won-cars" className="px-3 py-1.5 rounded border hover:bg-slate-50">
            {t.wonCars}
          </a>
          <a href="/buyers/bid-rules" className="px-3 py-1.5 rounded border hover:bg-slate-50">
            {t.bidRules}
          </a>
        </div>
      </div>

      <p className="text-sm mb-5">{t.paymentBefore} <a href="/buyers/settings" className="text-brand-700 underline">{t.paymentLink}</a> {t.paymentAfter}</p>

      {!me.active && (
        <div className="bg-amber-100 border border-amber-300 text-amber-900 p-4 rounded mb-6">
          <p className="font-semibold">{t.pendingTitle}</p>
          <p className="text-sm mt-1">
            {/* suspended_reason is typed by staff and shown as they wrote it. */}
            {me.suspended_reason || t.pendingDefault}
          </p>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card label={t.balance} value={`$${(me.balance_cents / 100).toFixed(2)}`} />
        <Card label={t.reliability} value={me.reliability?.toFixed(0) ?? "—"} />
        <Card label={t.tier} value={t.tiers[tier] ?? tier} />
      </section>

      {onboarding && <OnboardingChecklist status={onboarding} lang={lang} />}
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
