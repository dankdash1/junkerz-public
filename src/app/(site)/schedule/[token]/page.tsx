"use client";
import { API_BASE } from "@/lib/api-base";
import { statusHref } from "@/lib/status-link";
import { TIME_WINDOWS, WINDOW_START_HOUR, formatCentral, isTimeWindow, isSavedTimeWindow, quickPickDate, schedulePayload, windowForQuickPick, type TimeWindow, type SavedTimeWindow } from "@/lib/seller-schedule";
import SellerPickupGuidance from "@/components/junkerz/SellerPickupGuidance";
import { vinError } from "@/lib/seller-vin";
import { vinWarningLines } from "@/lib/pickup-vin";
import VinCheckNote from "@/components/junkerz/VinCheckNote";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NotLiveNotice } from "@/components/NotLive";
import { PICKUPS_LIVE } from "@/lib/site";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BASE = API_BASE;

type QuickPick = { key: string; label: string };
type FundedWindow = { pickup_date: string; window: TimeWindow };
type Offer = {
  funded_pickup_windows?: FundedWindow[] | null;
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

// The preferred three-hour windows live in @/lib/seller-schedule
// so the tests and this page read the same list. Every window is Central time;
// the backend derives the real pickup instant from pickup_date + window in
// America/Chicago, so this page never does timezone math of its own.

const scheduleError = (code?: string) => {
  if (code === "pickup_window_not_covered") return "That pickup window is no longer available. Refresh to see current times or call Junkerz.";
  if (code === "buyer_no_longer_eligible" || code === "active_firm_bid_required" || code === "confirmed_amount_changed" || code === "quote_closed") {
    return "This offer needs a staff review before scheduling. Please call Junkerz.";
  }
  return "We couldn't save your pickup request. Please try again or call Junkerz.";
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
  if (!PICKUPS_LIVE) return <NotLiveNoticeFromUrl />;
  return <SellerScheduleLive />;
}

function NotLiveNoticeFromUrl() {
  const sp = useSearchParams();
  return <NotLiveNotice es={sp.get("lang") === "es"} />;
}

function SellerScheduleLive() {
  const { token } = useParams<{ token: string }>();
  const search = useSearchParams();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [quickPicks, setQuickPicks] = useState<QuickPick[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState<string>(ymd(new Date()));
  const [windowSlot, setWindowSlot] = useState<TimeWindow>("10am-1pm");
  const [address, setAddress] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ slot: string; eta_at: string | null; window: SavedTimeWindow | null } | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const loadedOfferToken = useRef<string | null>(null);
  const autoSubmitted = useRef<string | null>(null);

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
          if (e.offer && e.slot) {
            setOffer(e.offer);
            setAddress(e.offer.pickup_address || "");
            setDone({ slot: e.slot, eta_at: e.eta_at || null, window: isSavedTimeWindow(e.window) ? e.window : null });
            setVinSkipped(true);
          } else {
            setLoadErr("Your pickup preference is already saved. Check your email for updates and partner confirmation.");
          }
        } else if (code === "expired") {
          setLoadErr("This link has expired. Text or call Junkerz to schedule.");
        } else {
          setLoadErr("Invalid scheduling link. Check the email or contact Junkerz.");
        }
        return;
      }
      const data = await r.json();
      loadedOfferToken.current = token;
      setOffer(data.offer);
      setQuickPicks(data.offer?.funded_pickup_windows == null ? data.quick_picks || [] : []);
      setAddress(data.offer?.pickup_address || "");
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
      const window = windowForQuickPick(qp.key, qp.label);
      try {
        const r = await fetch(`${BASE}/api/public/junkerz/seller/schedule/${token}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot: qp.label,
            quick_pick: qp.key,
            ...schedulePayload(quickPickDate(qp.key), window),
            pickup_address: address.trim(),
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(scheduleError((data as { error?: string }).error));
        setDone({ slot: data.slot, eta_at: data.eta_at, window: isSavedTimeWindow(data.window) ? data.window : window ?? null });
      } catch (e) {
        setSubmitErr((e as Error)?.message ?? "submit failed");
      } finally {
        setBusy(false);
      }
    },
    [token, address]
  );

  // An emailed quick pick can use the quote's saved address. An address the
  // seller types on this page needs a deliberate quick-pick click.
  useEffect(() => {
    if (loading || done || busy || loadedOfferToken.current !== token || autoSubmitted.current === token) return;
    const savedAddress = offer?.pickup_address?.trim();
    if (!savedAddress || address.trim() !== savedAddress) return;
    const qp = search.get("qp");
    if (!qp) return;
    const match = quickPicks.find((q) => q.key === qp);
    if (match) {
      autoSubmitted.current = token;
      void submitWithQuickPick(match);
    }
  }, [loading, offer, done, busy, search, quickPicks, submitWithQuickPick, address, token]);

  const submitCustom = async (selectedDate = date, selectedWindow = windowSlot) => {
    if (!offer) return;
    if (!address.trim()) {
      setSubmitErr("Please enter your pickup address first.");
      return;
    }
    // George 2026-05-18 bug: previously sent only `slot` (display string) and
    // omitted `eta_at`. Backend then stored NULL eta_at -> calendar bucketed
    // every custom pickup to today regardless of date picked.
    // George 2026-09-15: the seller's phone may not be on Central time, so the
    // body now names the chosen `window` label next to `pickup_date`; the
    // backend derives the real instant from date + window in America/Chicago.
    // `eta_at` (window start on the browser clock) is still sent for older
    // backends and is ignored once `window` is understood.
    const startHour = WINDOW_START_HOUR[selectedWindow] ?? 10;
    const d = new Date(selectedDate + "T00:00:00");
    d.setHours(startHour, 0, 0, 0);
    const slot = `${fmtDate(d)} — ${selectedWindow}`;
    setBusy(true); setSubmitErr(null);
    try {
      const r = await fetch(`${BASE}/api/public/junkerz/seller/schedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, ...schedulePayload(d, selectedWindow), pickup_address: address.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(scheduleError((data as { error?: string }).error));
      setDone({ slot: data.slot, eta_at: data.eta_at, window: isSavedTimeWindow(data.window) ? data.window : selectedWindow });
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
      if (!r.ok) throw new Error(vinError((data as { error?: string }).error));
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
          <h1 className="text-2xl font-bold">Pickup preference saved</h1>
          <p className="text-slate-700">
            {offer.year} {offer.make} {offer.model}
          </p>
          <p className="text-lg font-semibold text-brand-700">{done.slot}</p>
          {address && <p className="text-sm text-slate-700">Pickup address: {address}</p>}
          {/* Times are Central (America/Chicago) — the yard's clock, not the
              seller's phone. The instant comes back from the backend; this
              page only formats it. */}
          {done.window && (
            <p className="text-base font-semibold text-slate-800">
              Preferred window: {done.window} CT
            </p>
          )}
          {done.eta_at && formatCentral(done.eta_at) && (
            <p className="text-sm text-slate-500">
              Requested: {formatCentral(done.eta_at)} CT. All times are Central.
            </p>
          )}
          <p className="text-sm text-slate-600">
            This is your preferred time, subject to pickup partner availability and confirmation.
          </p>
          {typeof offer?.id === "number" && token && (
            <p className="text-sm">
              <a className="font-semibold text-brand-700 underline" href={statusHref(offer.id, token)}>
                Check your pickup status
              </a>
            </p>
          )}
        </div>

        <SellerPickupGuidance />

        {/* VIN + last-owner capture popup. Skippable. Buyer verifies on
            arrival regardless (George 2026-05-18 strategy: don't gate
            the sale on VIN). */}
        {!vinSaved && !vinSkipped && (
          <div className="bg-white border-2 border-brand-200 rounded-lg p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                ⚡ Speed up pickup day
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Add any details you have to help prepare the pickup paperwork.
                You can skip this and review the details with your pickup partner.
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
              {/* George 2026-11-23: check digit / model year is a warning, never a block. */}
              <div className="mt-2"><VinCheckNote vin={vin} year={offer?.year} /></div>
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
                Your pickup partner can review any document requirements with you before pickup.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={submitVin}
                disabled={vinSaving || (!vin.trim() && !ownerName.trim() && !ownerAddress.trim() && !titleState)}
                className="flex-1"
              >
                {vinSaving ? "Saving…" : vinWarningLines(vin, offer?.year).length ? "Save anyway" : "Save"}
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
          <div className="bg-brand-50 border border-brand-200 text-brand-800 rounded-lg p-4 text-sm">
            ✓ Got it — that&apos;ll speed things up on pickup day.
          </div>
        )}

        {vinSkipped && !vinSaved && (
          <p className="text-xs text-slate-500 text-center">
            No problem — review vehicle and ownership details with your pickup partner before pickup. Keep your plates and toll tag.
          </p>
        )}
      </main>
    );
  }

  const dollars = offer.offer_cents != null ? `$${(offer.offer_cents / 100).toFixed(offer.offer_cents % 100 ? 2 : 0)}` : "—";

  const fundedWindows = offer.funded_pickup_windows;

  return (
    <main className="max-w-md mx-auto pt-8 px-4 pb-16 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Choose your preferred pickup time</h1>
        <p className="text-sm text-slate-600 mt-2">Three-hour windows are in Central time, subject to pickup partner availability and confirmation.</p>
        <p className="text-sm text-slate-600 mt-1">
          {offer.year} {offer.make} {offer.model}
          {offer.zip_code ? ` · ${offer.zip_code}` : ""}
        </p>
        <p className="text-sm text-slate-500">
          Payout: <span className="font-semibold text-brand-700">{dollars}</span>
        </p>
      </header>

      {submitErr && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {submitErr}
        </div>
      )}

      <section>
        <Label htmlFor="pickup-address" className="text-sm font-semibold text-slate-700">Pickup address</Label>
        <Input
          id="pickup-address"
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

      {fundedWindows != null ? (
        <section aria-label="Available pickup windows">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Available pickup windows</h2>
          {fundedWindows.length ? (
            <div className="grid gap-2">
              {fundedWindows.map(({ pickup_date, window }) => (
                <Button key={`${pickup_date}-${window}`} variant="outline" disabled={busy}
                  onClick={() => void submitCustom(pickup_date, window)}>
                  {fmtDate(new Date(`${pickup_date}T12:00:00`))} · {window} CT
                </Button>
              ))}
            </div>
          ) : <p className="text-sm text-slate-600">Call Junkerz to confirm your offer and pickup time.</p>}
        </section>
      ) : <section>
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
      </section>}

      {fundedWindows == null && showCustom && (
        <section id="custom-time">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">Custom time</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pickup-date" className="text-xs">Date</Label>
              <Input
                id="pickup-date"
                type="date"
                value={date}
                min={ymd(new Date())}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pickup-window" className="text-xs">Time window (Central)</Label>
              <select
                id="pickup-window"
                value={windowSlot}
                onChange={(e) => { if (isTimeWindow(e.target.value)) setWindowSlot(e.target.value); }}
                className="w-full h-10 border rounded px-2 text-sm"
              >
                {TIME_WINDOWS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
          <Button onClick={() => void submitCustom()} disabled={busy} className="w-full mt-3">
            {busy ? "Saving…" : "Save pickup preference"}
          </Button>
        </section>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 space-y-1">
        <p>
          <strong>Next step:</strong> Keep your phone nearby and check your email. Your pickup partner will call once assigned to confirm availability and pickup details.
        </p>
        <p>
          Link good for 72 hours. If you don&apos;t pick one we&apos;ll contact you to schedule.
        </p>
      </div>
    </main>
  );
}
