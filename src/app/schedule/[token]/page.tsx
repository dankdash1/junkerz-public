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

// Map the human-readable window to the START hour (24h) so we can build
// a real ISO timestamp for the backend's eta_at column. Without this,
// the backend stored NULL eta_at and the calendar bucketed the pickup
// to today instead of the chosen date (George 2026-05-18 bug report).
const WINDOW_START_HOUR: Record<string, number> = {
  "9am-11am": 9,
  "11am-1pm": 11,
  "1pm-3pm": 13,
  "3pm-5pm": 15,
  "5pm-7pm": 17,
  "All day": 10,  // default to morning if seller picks "All day"
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
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
  const [showCustom, setShowCustom] = useState(false);

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
    // George 2026-05-18 bug: previously sent only `slot` (display string) and
    // omitted `eta_at`. Backend then stored NULL eta_at -> calendar bucketed
    // every custom pickup to today regardless of date picked. Fix: build a
    // real ISO timestamp from the chosen date + window start hour and
    // include it in the POST body.
    const startHour = WINDOW_START_HOUR[windowSlot] ?? 10;
    // Build a local Date at the window start, then ISO it. The seller's
    // browser timezone is the source of truth for what "1pm-3pm" means.
    const d = new Date(date + "T00:00:00");
    d.setHours(startHour, 0, 0, 0);
    const etaIso = d.toISOString();
    const slot = `${fmtDate(d)} — ${windowSlot}`;
    setBusy(true); setSubmitErr(null);
    try {
      const r = await fetch(`${BASE}/api/public/junkerz/seller/schedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, eta_at: etaIso, pickup_address: address.trim() }),
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

  // VIN capture state — popup shown after `done` is set (post-schedule).
  // Skippable; buyer verifies on arrival regardless. George 2026-05-18:
  // "make the buyer verify it and just let it go through ... we don't lose
  // a sale and we put that on the buyer".
  const [vin, setVin] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");
  const [titleState, setTitleState] = useState("");
  const [vinSaving, setVinSaving] = useState(false);
  const [vinSaved, setVinSaved] = useState(false);
  const [vinSkipped, setVinSkipped] = useState(false);
  const [vinErr, setVinErr] = useState<string | null>(null);

  const submitVin = async () => {
    setVinSaving(true); setVinErr(null);
    try {
      const r = await fetch(`${BASE}/api/public/junkerz/seller/vin-update/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: vin.trim() || null,
          last_owner_name: ownerName.trim() || null,
          last_owner_address: ownerAddress.trim() || null,
          title_state: titleState.trim() || null,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error((data as { error?: string }).error || "save failed");
      setVinSaved(true);
    } catch (e) {
      setVinErr((e as Error)?.message ?? "save failed");
    } finally {
      setVinSaving(false);
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
      <main className="max-w-md mx-auto pt-12 px-6 pb-12 space-y-5">
        <div className="text-center space-y-3">
          <div className="text-5xl">✓</div>
          <h1 className="text-2xl font-bold">Pickup scheduled</h1>
          <p className="text-slate-700">
            {offer.year} {offer.make} {offer.model}
          </p>
          <p className="text-lg font-semibold text-emerald-700">{done.slot}</p>
          {done.eta_at && (
            <p className="text-sm text-slate-500">
              Driver arrives around {new Date(done.eta_at).toLocaleString(undefined,
                { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              {" "}— within a 1-3 hour window.
            </p>
          )}
          <p className="text-sm text-slate-600">
            We&apos;ll text you 30 minutes before the driver arrives.
            {offer.contact_phone ? ` (We have ${offer.contact_phone} on file.)` : ""}
          </p>
        </div>

        {/* VIN + last-owner capture popup. Skippable. Buyer verifies on
            arrival regardless (George 2026-05-18 strategy: don't gate
            the sale on VIN). */}
        {!vinSaved && !vinSkipped && (
          <div className="bg-white border-2 border-emerald-200 rounded-lg p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ⚡ Speed up pickup day
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Add a few details now and pickup paperwork takes 2 minutes
                instead of 15. Skip if you don&apos;t have these handy —
                our driver will collect everything on arrival.
              </p>
            </div>

            {vinErr && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded p-2 text-xs">
                {vinErr}
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">VIN (17 characters)</Label>
              <Input
                value={vin}
                onChange={(e) => setVin(e.target.value.toUpperCase())}
                placeholder="1HGBH41JXMN109186"
                maxLength={17}
                className="mt-1 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Look on the dashboard near the windshield, or the driver-side door jamb sticker.
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold">Name on the title</Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="John Q Public"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Address on the title</Label>
              <Input
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                placeholder="123 Main St, City, ST"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">State the title was issued in</Label>
              <select
                value={titleState}
                onChange={(e) => setTitleState(e.target.value)}
                className="w-full h-10 mt-1 border rounded px-2 text-sm"
              >
                <option value="">— pick a state —</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Some states require the title to be notarized BEFORE pickup.
                Heads up so we don&apos;t arrive and find out.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={submitVin}
                disabled={vinSaving || (!vin.trim() && !ownerName.trim() && !ownerAddress.trim() && !titleState)}
                className="flex-1"
              >
                {vinSaving ? "Saving…" : "Save"}
              </Button>
              <Button
                onClick={() => setVinSkipped(true)}
                disabled={vinSaving}
                variant="outline"
                className="flex-1"
              >
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {vinSaved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 text-sm">
            ✓ Got it — that&apos;ll speed things up on pickup day.
          </div>
        )}

        {vinSkipped && !vinSaved && (
          <p className="text-xs text-slate-500 text-center">
            No problem — our driver will collect VIN, title, and plates on arrival.
          </p>
        )}
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
          {/* Explicit Custom Time button — was buried below the quick picks
              section previously. George 2026-05-18: "there needs to be a
              button that goes into custom time". This one scrolls the user
              down to the date+window picker. */}
          <Button
            onClick={() => {
              setShowCustom(true);
              setTimeout(() => {
                document.getElementById("custom-time")?.scrollIntoView({ behavior: "smooth" });
              }, 50);
            }}
            disabled={busy}
            variant="outline"
            className="justify-start text-left h-auto py-3"
          >
            📆 Pick a custom date & time
          </Button>
        </div>
      </section>

      {showCustom && (
        <section id="custom-time">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Custom time</h2>
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
      )}

      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 space-y-1">
        <p>
          <strong>Pickup window:</strong> driver arrives within a 1-3 hour window
          of your chosen time. We&apos;ll text you 30 minutes out.
        </p>
        <p>
          Link good for 72 hours. If you don&apos;t pick one we&apos;ll text you to schedule.
        </p>
      </div>
    </main>
  );
}
