"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeDollarSign, ArrowLeft, Check, ShieldCheck, Phone } from "lucide-react";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitQuote } from "@/lib/api";
import VehiclePicker, { VehicleSelection } from "@/components/VehiclePicker";
import ConditionGrid, { DamageZones } from "@/components/ConditionGrid";

const STEPS = ["vehicle", "condition", "parts", "contact"] as const;

const STEP_META: { title: string; subtitle: string }[] = [
  { title: "Which car are we buying?",
    subtitle: "Year, make and model. Add the VIN only if it is handy." },
  { title: "Paperwork and pulse",
    subtitle: "The title and whether it moves shift the number more than anything else." },
  { title: "What is still bolted to it?",
    subtitle: "We have filled in the usual answers. Change anything that is different on yours." },
  { title: "Where is it, and how do we reach you?",
    subtitle: "We tow free from wherever it sits and send your number straight over." },
];

const mono = "font-[family-name:var(--font-geist-mono)]";

type Form = {
  vehicle: VehicleSelection;
  vin: string;
  mileage: string;
  title_status: string;
  runs: boolean | null;
  starts: boolean | null;
  all_wheels_attached: boolean | null;
  all_tires_inflated: boolean | null;
  engine_state: "intact" | "partial" | "missing" | "";
  transmission_state: "intact" | "partial" | "missing" | "";
  has_catalytic: boolean | null;
  has_battery: boolean | null;
  has_keys: boolean | null;
  damage_zones: DamageZones;
  zip_code: string;
  pickup_address: string;
  phone: string;
  email: string;
};

const EMPTY_VEHICLE: VehicleSelection = {
  year: null, make_id: null, make_name: null,
  model_id: null, model_name: null, trim: "",
};

const EMPTY_DAMAGE: DamageZones = {
  front: "none", rear: "none", left: "none", right: "none",
  engine_bay: "none", glass: "none", airbags_deployed: "none",
  flood: "none", fire: "none",
};

function YesNo({ label, value, onChange }: {
  label: string; value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-zinc-700">{label}</Label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {[true, false].map((opt) => (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition
              ${value === opt
                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}
          >
            {value === opt && <Check className="h-4 w-4" />}
            {opt ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoiceRow({ options, value, onChange }: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`h-11 rounded-xl border text-sm font-semibold capitalize transition
            ${value === s
              ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

function QuoteWizardInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    vehicle: EMPTY_VEHICLE,
    vin: "",
    mileage: "",
    title_status: "",
    runs: null, starts: null,
    all_wheels_attached: true, all_tires_inflated: true,
    engine_state: "intact", transmission_state: "intact",
    has_catalytic: true, has_battery: true, has_keys: true,
    damage_zones: EMPTY_DAMAGE,
    zip_code: "", pickup_address: "", phone: "", email: "",
  });
  const [touched, setTouched] = useState<{ phone: boolean; email: boolean }>({
    phone: false,
    email: false,
  });
  // The homepage asks for year, make and model. If the seller came from there,
  // carry it straight in and skip the step they already finished.
  useEffect(() => {
    const year = sp.get("year");
    const makeId = sp.get("make_id");
    const modelId = sp.get("model_id");
    const make = sp.get("make");
    const model = sp.get("model");
    if (!year || !makeId || !modelId || !make || !model) return;
    setForm((f) => ({
      ...f,
      vehicle: {
        year: Number(year),
        make_id: Number(makeId),
        make_name: make,
        model_id: Number(modelId),
        model_name: model,
        trim: "",
      },
    }));
    setStep((cur) => (cur === 0 ? 1 : cur));
    // Only ever runs for the values present on first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conditionFromAnswers = () => {
    if (form.runs) return "runs";
    if (form.starts) return "starts_no_drive";
    if (form.engine_state === "missing") return "wrecked";
    return "dead";
  };

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const v = form.vehicle;
      const result = await submitQuote({
        vin: form.vin || `UNK_${v.year}_${v.make_name}_${v.model_name}`,
        year: v.year ?? 0,
        make: v.make_name ?? "",
        model: v.model_name ?? "",
        condition: conditionFromAnswers(),
        title_status: form.title_status,
        weight_lbs: 3000,
        zip_code: form.zip_code,
        pickup_address: form.pickup_address || undefined,
        photo_count: 0,
        trim: v.trim || undefined,
        mileage: form.mileage ? parseInt(form.mileage, 10) : undefined,
        make_id: v.make_id, model_id: v.model_id,
        runs: form.runs ?? undefined,
        starts: form.starts ?? undefined,
        all_wheels_attached: form.all_wheels_attached ?? undefined,
        all_tires_inflated: form.all_tires_inflated ?? undefined,
        engine_state: form.engine_state || undefined,
        transmission_state: form.transmission_state || undefined,
        has_catalytic: form.has_catalytic ?? undefined,
        has_battery: form.has_battery ?? undefined,
        has_keys: form.has_keys ?? undefined,
        damage_zones: form.damage_zones,
        contact_phone: form.phone,
        contact_email: form.email,
      });
      router.push(`/quote/result?id=${result.offer_id}&status=${result.status}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance = (() => {
    if (step === 0) return !!(form.vehicle.year && form.vehicle.make_id && form.vehicle.model_id);
    // Title plus whether it runs. Wheels and tyres carry sensible defaults.
    if (step === 1) return !!form.title_status && form.runs !== null && form.starts !== null;
    // Everything here is pre-answered with the common case, so it never blocks.
    if (step === 2) return true;
    if (step === 3) return form.zip_code.length >= 5
                           && isValidPhone(form.phone) && isValidEmail(form.email);
    return false;
  })();

  const phoneError = touched.phone && !isValidPhone(form.phone)
    ? (form.phone.trim() === "" ? "Phone is required" : "Enter a valid 10-digit phone number")
    : null;
  const emailError = touched.email && !isValidEmail(form.email)
    ? (form.email.trim() === "" ? "Email is required" : "Enter a valid email address")
    : null;

  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  const meta = STEP_META[step];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 -rotate-6 place-items-center rounded-lg bg-emerald-600 text-white">
              <BadgeDollarSign className="h-5 w-5" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Junkerz</span>
          </Link>
          <div className="flex items-center gap-4">
            <a href={SITE.phoneHref}
               className="hidden items-center gap-1.5 text-sm font-bold text-zinc-800 hover:text-emerald-700 sm:flex">
              <Phone className="h-4 w-4" /> {SITE.phone}
            </a>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Guaranteed offer
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
        {/* progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 ${mono}`}>
              Step {step + 1} of {STEPS.length}
            </span>
            <span className={`text-xs font-semibold text-zinc-400 ${mono}`}>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* what we already know */}
        {form.vehicle.year && form.vehicle.make_name && form.vehicle.model_name && step > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="text-sm font-semibold text-emerald-900">
              {form.vehicle.year} {form.vehicle.make_name} {form.vehicle.model_name}
            </span>
            <button type="button" onClick={() => setStep(0)}
              className="text-xs font-semibold text-emerald-700 underline">
              Change
            </button>
          </div>
        )}

        {/* step heading */}
        <h1 className="text-balance text-2xl font-extrabold tracking-tight">{meta.title}</h1>
        <p className="mt-1.5 text-sm text-zinc-500">{meta.subtitle}</p>

        {/* card */}
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          {step === 0 && (
            <div className="space-y-4">
              <VehiclePicker
                value={form.vehicle}
                onChange={(v) => setForm({ ...form, vehicle: v })}
              />
              <div>
                <Label>VIN (optional)</Label>
                <Input value={form.vin} onChange={(e) =>
                  setForm({ ...form, vin: e.target.value })} />
              </div>
              <div>
                <Label>Mileage (optional)</Label>
                <Input type="number" value={form.mileage} onChange={(e) =>
                  setForm({ ...form, mileage: e.target.value })} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-zinc-700">
                  What is the title situation?
                </Label>
                <div className="mt-2 space-y-2.5">
                  {[
                    ["clean", "Clean title, I have it"],
                    ["salvage", "Salvage title"],
                    ["rebuilt", "Rebuilt title"],
                    ["no_title", "No title, or I cannot find it"],
                  ].map(([t, label]) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, title_status: t })}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition
                        ${form.title_status === t
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}
                    >
                      {label}
                      {form.title_status === t && <Check className="h-5 w-5 text-emerald-600" />}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  No title is usually fine in Texas. We will tell you what your case needs.
                </p>
              </div>

              <div className="space-y-5 border-t border-zinc-100 pt-5">
                <YesNo label="Does it drive under its own power?"
                  value={form.runs}
                  onChange={(v) => setForm({ ...form, runs: v, starts: v ? true : form.starts })} />
                <YesNo label="Does the engine at least turn over?"
                  value={form.starts}
                  onChange={(v) => setForm({ ...form, starts: v })} />
                <YesNo label="Are all four wheels still on it?"
                  value={form.all_wheels_attached}
                  onChange={(v) => setForm({ ...form, all_wheels_attached: v })} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                These are pre-filled with the usual answers. Only change what is
                different on your car.
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-zinc-700">Engine</Label>
                  <div className="mt-2">
                    <ChoiceRow options={["intact", "partial", "missing"] as const}
                      value={form.engine_state}
                      onChange={(s) => setForm({ ...form, engine_state: s as Form["engine_state"] })} />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-zinc-700">Transmission</Label>
                  <div className="mt-2">
                    <ChoiceRow options={["intact", "partial", "missing"] as const}
                      value={form.transmission_state}
                      onChange={(s) => setForm({ ...form, transmission_state: s as Form["transmission_state"] })} />
                  </div>
                </div>
                <YesNo label="Catalytic converter still on it?"
                  value={form.has_catalytic}
                  onChange={(v) => setForm({ ...form, has_catalytic: v })} />
                <YesNo label="Do you have the keys?"
                  value={form.has_keys}
                  onChange={(v) => setForm({ ...form, has_keys: v })} />
              </div>

              <details className="rounded-xl border border-zinc-200 bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-zinc-700 [&::-webkit-details-marker]:hidden">
                  Any body damage? Tap to mark it (optional)
                </summary>
                <div className="border-t border-zinc-100 p-4">
                  <ConditionGrid
                    value={form.damage_zones}
                    onChange={(v) => setForm({ ...form, damage_zones: v })}
                  />
                </div>
              </details>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="zip">
                    Zip code <span className="text-red-600">*</span>
                  </Label>
                  <Input id="zip" inputMode="numeric" autoComplete="postal-code"
                    value={form.zip_code}
                    onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                    placeholder="75252" />
                </div>
                <div>
                  <Label htmlFor="addr">Street address (optional)</Label>
                  <Input id="addr" autoComplete="street-address"
                    value={form.pickup_address}
                    onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                    placeholder="We can confirm this later" />
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-100 pt-5">
                <div>
                  <Label htmlFor="phone">
                    Phone <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="phone" type="tel" inputMode="tel" autoComplete="tel" required
                    aria-required="true" aria-invalid={phoneError ? "true" : "false"}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                    placeholder="(817) 555-0100"
                  />
                  {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
                </div>
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="email" type="email" inputMode="email" autoComplete="email" required
                    aria-required="true" aria-invalid={emailError ? "true" : "false"}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    placeholder="you@example.com"
                  />
                  {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
                </div>
                <p className="text-xs text-zinc-500">
                  We text your offer and email the confirmation. We never sell your details.
                </p>
              </div>
            </div>
          )}

        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {/* nav */}
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="h-12 gap-1.5 px-4"
              onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button className="h-12 flex-1 text-base font-semibold" disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}>Continue</Button>
          ) : (
            <Button className="h-12 flex-1 text-base font-bold" disabled={!canAdvance || submitting}
              onClick={submit}>
              {submitting ? "Getting your offer…" : "Get my offer"}
            </Button>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-zinc-400">
          Free towing · No fees · Paid at pickup
        </p>
      </div>
    </main>
  );
}

export default function QuotePage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-zinc-50 text-zinc-500">
          Loading your quote…
        </main>
      }
    >
      <QuoteWizardInner />
    </Suspense>
  );
}
