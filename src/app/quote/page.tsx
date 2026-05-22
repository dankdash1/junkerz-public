"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitQuote } from "@/lib/api";
import VehiclePicker, { VehicleSelection } from "@/components/VehiclePicker";
import ConditionGrid, { DamageZones } from "@/components/ConditionGrid";

const STEPS = ["vehicle", "title", "drivability", "components", "damage", "zip", "contact"] as const;

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
      <Label>{label}</Label>
      <div className="flex gap-2 mt-1">
        <Button
          variant={value === true ? "default" : "outline"}
          onClick={() => onChange(true)}>Yes</Button>
        <Button
          variant={value === false ? "default" : "outline"}
          onClick={() => onChange(false)}>No</Button>
      </div>
    </div>
  );
}

function isValidPhone(phone: string) {
  return phone.replace(/\D/g, "").length >= 10;
}

function isValidEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email.trim());
}

export default function QuoteWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    vehicle: EMPTY_VEHICLE,
    vin: "",
    mileage: "",
    title_status: "",
    runs: null, starts: null,
    all_wheels_attached: null, all_tires_inflated: null,
    engine_state: "", transmission_state: "",
    has_catalytic: null, has_battery: null, has_keys: null,
    damage_zones: EMPTY_DAMAGE,
    zip_code: "", pickup_address: "", phone: "", email: "",
  });
  const [touched, setTouched] = useState<{ phone: boolean; email: boolean }>({
    phone: false,
    email: false,
  });
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
    if (step === 1) return !!form.title_status;
    if (step === 2) return form.runs !== null && form.starts !== null
                           && form.all_wheels_attached !== null;
    if (step === 3) return !!form.engine_state && !!form.transmission_state
                           && form.has_catalytic !== null
                           && form.has_battery !== null && form.has_keys !== null;
    if (step === 4) return true;
    if (step === 5) return form.zip_code.length >= 5;
    if (step === 6) return isValidPhone(form.phone) && isValidEmail(form.email);
    return false;
  })();

  const phoneError = touched.phone && !isValidPhone(form.phone)
    ? (form.phone.trim() === "" ? "Phone is required" : "Enter a valid 10-digit phone number")
    : null;
  const emailError = touched.email && !isValidEmail(form.email)
    ? (form.email.trim() === "" ? "Email is required" : "Enter a valid email address")
    : null;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-md mx-auto pt-12">
        <h1 className="text-2xl font-bold mb-6">
          Step {step + 1} of {STEPS.length}
        </h1>

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
          <div className="space-y-4">
            <Label>Title Status</Label>
            {["clean", "salvage", "rebuilt", "no_title"].map((t) => (
              <Button
                key={t}
                variant={form.title_status === t ? "default" : "outline"}
                className="w-full"
                onClick={() => setForm({ ...form, title_status: t })}
              >{t.replace("_", " ")}</Button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <YesNo label="Does it run/drive?"
              value={form.runs}
              onChange={(v) => setForm({ ...form, runs: v })} />
            <YesNo label="Does it start?"
              value={form.starts}
              onChange={(v) => setForm({ ...form, starts: v })} />
            <YesNo label="All four wheels attached?"
              value={form.all_wheels_attached}
              onChange={(v) => setForm({ ...form, all_wheels_attached: v })} />
            <YesNo label="All tires inflated?"
              value={form.all_tires_inflated}
              onChange={(v) => setForm({ ...form, all_tires_inflated: v })} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Engine</Label>
              <div className="flex gap-2 mt-1">
                {(["intact","partial","missing"] as const).map((s) => (
                  <Button key={s}
                    variant={form.engine_state === s ? "default" : "outline"}
                    onClick={() => setForm({ ...form, engine_state: s })}>{s}</Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Transmission</Label>
              <div className="flex gap-2 mt-1">
                {(["intact","partial","missing"] as const).map((s) => (
                  <Button key={s}
                    variant={form.transmission_state === s ? "default" : "outline"}
                    onClick={() => setForm({ ...form, transmission_state: s })}>{s}</Button>
                ))}
              </div>
            </div>
            <YesNo label="Catalytic converter installed?"
              value={form.has_catalytic}
              onChange={(v) => setForm({ ...form, has_catalytic: v })} />
            <YesNo label="Battery present?"
              value={form.has_battery}
              onChange={(v) => setForm({ ...form, has_battery: v })} />
            <YesNo label="Keys available?"
              value={form.has_keys}
              onChange={(v) => setForm({ ...form, has_keys: v })} />
          </div>
        )}

        {step === 4 && (
          <ConditionGrid
            value={form.damage_zones}
            onChange={(v) => setForm({ ...form, damage_zones: v })}
          />
        )}

        {step === 5 && (
          <div className="space-y-4">
            <Label>Zip code</Label>
            <Input value={form.zip_code} onChange={(e) =>
              setForm({ ...form, zip_code: e.target.value })} />
            <Label>Pickup address (optional)</Label>
            <Input
              value={form.pickup_address}
              onChange={(e) =>
                setForm({ ...form, pickup_address: e.target.value })
              }
              placeholder="Street, city, state — we'll confirm later"
            />
            <p className="text-xs text-slate-500">
              You can leave this blank and we&apos;ll ask when we schedule pickup.
            </p>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">
                Phone <span className="text-red-600">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                aria-required="true"
                aria-invalid={phoneError ? "true" : "false"}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                placeholder="(555) 123-4567"
              />
              {phoneError && (
                <p className="text-red-600 text-sm mt-1">{phoneError}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">
                Email <span className="text-red-600">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-required="true"
                aria-invalid={emailError ? "true" : "false"}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="you@example.com"
              />
              {emailError && (
                <p className="text-red-600 text-sm mt-1">{emailError}</p>
              )}
            </div>
            <p className="text-xs text-slate-500">
              We&apos;ll text your offer to your phone and email you the
              confirmation. Both are required.
            </p>
          </div>
        )}

        {error && <p className="text-red-600 mt-4">{error}</p>}

        <div className="flex gap-2 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button className="flex-1" disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}>Next</Button>
          ) : (
            <Button className="flex-1" disabled={!canAdvance || submitting}
              onClick={submit}>
              {submitting ? "Getting offer..." : "Get my offer"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
