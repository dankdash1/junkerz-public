"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

type QuickPick = { key: string; label: string };
type Offer = {
  id: number;
  vin: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  condition: string | null;
  offer_cents: number | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  zip_code: string | null;
  pickup_address: string | null;
  seller_schedule_token_expires_at: string | null;
};

const TIME_WINDOWS = [
  "9am-11am", "11am-1pm", "1pm-3pm", "3pm-5pm", "5pm-7pm", "All day",
];

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const ymd = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function SellerSchedulePage() {
  const { token } = useParams<{ token: string }>();
  const search = useSearchParams();
  const router = useRouter();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [quickPicks, setQuickPicks] = useState<QuickPick[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState<string>(ymd(new Date()));
  const [windowSlot, setWindowSlot] = useState("9am-11am");
  const [address, setAddress] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ slot: string; eta_at: string | null } | null>(null);

  const loadOffer = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const r = await fetch(`${BASE}/api/public/junkerz/seller/schedule/${token}`);
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        const code = (e as { error?: string }).error;
        if (code === "already_scheduled") {
          setLoadErr("This pickup is already scheduled. Check your email for the time.");
        } else if (code === "expired") {
          setLoadErr("This link has expired. Text or call Junkerz to schedule.");
        } else {
          setLoadErr("Invalid scheduling link. Check the email or contact Junkerz.");
        }
        return;
      }
      const data = await r.json();
      setOffer(data.offer);
      setQuickPicks(data.quick_picks || []);
      if (data.offer?.pickup_address) setAddress(data.offer.pickup_address);
    } catch (e) {
      setLoadErr((e as Error)?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void loadOffer(); }, [loadOffer]);

  const submitWithQuickPick = useCallback(
    async (qp: QuickPick) => {
      if (!address.trim()) {
        setSubmitErr("Please enter your pickup address first.");
        return;
      }
      setBusy(true);
      setSubmitErr(null);
      try {
        const r = await fetch(`${BASE}/api/public/junkerz/seller/schedule/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot: qp.label,
            quick_pick: qp.key,
            pickup_address: address.trim(),
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error((data as { error?: string }).error || "submit failed");
        setDone({ slot: data.slot, eta_at: data.eta_at });
      } catch (e) {
        setSubmitErr((e as Error)?.message ?? "submit failed");
      } finally {
        setBusy(false);
      }
    },
    [token, address]
  );

  // Auto-submit ONLY if email link has ?qp= AND we already have an address
  // pre-filled from the quote. If address is blank, force seller to confirm
  // it manually so we never schedule a pickup at an unknown location.
  useEffect(() => {
    if (!offer || done || busy) return;
    const qp = search.get("qp");
    if (!qp) return;
    if (!address.trim()) return;  // wait for seller to enter / edit address
    const match = quickPicks.find((q) => q.key === qp);
    if (match) void submitWithQuickPick(match);
  }, [offer, done, busy, search, quickPicks, submitWithQuickPick, address]);

  const submitCustom = async () => {
    if (!offer) return;
    if (!address.trim()) {
      setSubmitErr("Please enter your pickup address first.");
      return;
    }
    const d = new Date(date + "T12:00:00");
    const slot = `${fmtDate(d)} — ${windowSlot}`;
    setBusy(true); setSubmitErr(null);
    try {
      const r = await fetch(`${BASE}/api/public/junkerz/seller/schedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, pickup_address: address.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error((data as { error?: string }).error || "submit failed");
      setDone({ slot: data.slot, eta_at: data.eta_at });
    } catch (e) {
      setSubmitErr((e as Error)?.message ?? "submit failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <main className="p-12 text-center">Loading…</main>;
  if (loadErr) {
    return (
      <main className="max-w-md mx-auto pt-16 px-6 text-center space-y-3">
        <h1 className="text-2xl font-bold">Schedule pickup</h1>
        <p className="text-red-600">{loadErr}</p>
      </main>
    );
  }
  if (!offer) return null;

  if (done) {
    return (
      <main className="max-w-md mx-auto pt-12 px-6 text-center space-y-4">
        <div className="text-5xl">✓</div>
        <h1 className="text-2xl font-bold">Pickup scheduled</h1>
        <p className="text-slate-700">
          {offer.year} {offer.make} {offer.model}
        </p>
        <p className="text-lg font-semibold text-emerald-700">{done.slot}</p>
        {done.eta_at && (
          <p className="text-sm text-slate-500">
            ETA {new Date(done.eta_at).toLocaleString()}
          </p>
        )}
        <p className="text-sm text-slate-600 mt-4">
          We&apos;ll text you 30 minutes before the driver arrives.
          {offer.contact_phone ? ` (We have ${offer.contact_phone} on file.)` : ""}
        </p>
      </main>
    );
  }

  const dollars = offer.offer_cents != null ? `$${(offer.offer_cents / 100).toFixed(0)}` : "—";

  return (
    <main className="max-w-md mx-auto pt-8 px-4 pb-16 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Schedule pickup</h1>
        <p className="text-sm text-slate-600 mt-1">
          {offer.year} {offer.make} {offer.model}
          {offer.zip_code ? ` · ${offer.zip_code}` : ""}
        </p>
        <p className="text-sm text-slate-500">
          Payout: <span className="font-semibold text-emerald-700">{dollars}</span>
        </p>
      </header>

      {submitErr && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {submitErr}
        </div>
      )}

      <section>
        <Label className="text-sm font-semibold text-slate-700">Pickup address</Label>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="123 Main St, City, State, ZIP"
          className="mt-1"
        />
        <p className="text-xs text-slate-500 mt-1">
          Where the driver should pick up the vehicle. We pre-filled from your
          quote — edit if it&apos;s wrong or you want pickup at a different spot.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Quick picks</h2>
        <div className="grid grid-cols-1 gap-2">
          {quickPicks.map((q) => (
            <Button
              key={q.key}
              onClick={() => void submitWithQuickPick(q)}
              disabled={busy}
              variant={q.key === "immediately" ? "default" : "outline"}
              className="justify-start text-left h-auto py-3"
            >
              {q.key === "immediately" ? "⚡ " : "🕐 "}
              {q.label}
            </Button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-slate-700 mb-2">…or pick a custom time</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={date}
              min={ymd(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Time window</Label>
            <select
              value={windowSlot}
              onChange={(e) => setWindowSlot(e.target.value)}
              className="w-full h-10 border rounded px-2 text-sm"
            >
              {TIME_WINDOWS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
        </div>
        <Button onClick={submitCustom} disabled={busy} className="w-full mt-3">
          {busy ? "Saving…" : "Schedule this slot"}
        </Button>
      </section>

      <p className="text-xs text-slate-500 text-center">
        This link is good for 72 hours. If you don&apos;t pick one we&apos;ll text you to schedule.
      </p>
    </main>
  );
}
