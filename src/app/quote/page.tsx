"use client";
import { Suspense, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeDollarSign, ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitQuote } from "@/lib/api";
import { trackLeadSubmission } from "@/components/Analytics";
import VehiclePicker, { VehicleSelection } from "@/components/VehiclePicker";
import VehicleAutofill from "@/components/VehicleAutofill";
import ConditionGrid, { DamageZones } from "@/components/ConditionGrid";

const STEPS = ["vehicle", "title", "drivability", "components", "damage", "zip", "contact"] as const;

const STEP_META: { title: string; subtitle: string }[] = [
  { title: "What are we buying?", subtitle: "Pick your vehicle — VIN and mileage are optional." },
  { title: "Do you have the title?", subtitle: "No title is often fine — just let us know." },
  { title: "Does it run?", subtitle: "Be honest — dead cars are still worth real cash." },
  { title: "What's still on it?", subtitle: "Engine, transmission and key parts drive the offer." },
  { title: "Any damage?", subtitle: "Tap any areas that are wrecked or missing." },
  { title: "Where is it?", subtitle: "We tow from your location — always free." },
  { title: "Where do we send the offer?", subtitle: "We'll text and email your guaranteed number." },
];

const mono = "font-[family-name:var(--font-geist-mono)]";

type Lang = "en" | "es";

const T = {
  en: {
    steps: [
      { title: "What are we buying?", subtitle: "Pick your vehicle — VIN and mileage are optional." },
      { title: "Do you have the title?", subtitle: "No title is often fine — just let us know." },
      { title: "Does it run?", subtitle: "Be honest — dead cars are still worth real cash." },
      { title: "What's still on it?", subtitle: "Engine, transmission and key parts drive the offer." },
      { title: "Any damage?", subtitle: "Tap any areas that are wrecked or missing." },
      { title: "Where is it?", subtitle: "We tow from your location — always free." },
      { title: "Where do we send the offer?", subtitle: "We'll text and email your guaranteed number." },
    ],
    guaranteed: "Guaranteed offer", step: "Step", of: "of",
    back: "Back", cont: "Continue", submit: "Get my offer", submitting: "Getting your offer…",
    vin: "VIN (optional)", mileage: "Mileage (optional)",
    titles: { clean: "Clean title", salvage: "Salvage title", rebuilt: "Rebuilt title", no_title: "No title" },
    runs: "Does it run/drive?", starts: "Does it start?",
    wheels: "All four wheels attached?", tires: "All tires inflated?",
    whichFlat: "Which ones are flat?",
    flat: { front: "Front", rear: "Rear", both: "Both ends" },
    flatHint: "It decides which truck we send, so it saves you a wasted visit.",
    engine: "Engine", trans: "Transmission",
    cat: "Catalytic converter installed?", battery: "Battery present?", keys: "Keys available?",
    zip: "Zip code", address: "Pickup address (optional)",
    addressHint: "You can leave this blank and we'll ask when we schedule pickup.",
    phone: "Phone", email: "Email",
    phoneReq: "Phone is required", phoneBad: "Enter a valid 10-digit phone number",
    emailReq: "Email is required", emailBad: "Enter a valid email address",
    contactHint: "We'll text your offer to your phone and email you the confirmation. Both are required.",
    footer: "{t.footer}",
    yes: "Yes", no: "No",
    choice: { intact: "intact", partial: "partial", missing: "missing" },
  },
  es: {
    steps: [
      { title: "¿Qué carro vamos a comprar?", subtitle: "Elija su vehículo — el VIN y el millaje son opcionales." },
      { title: "¿Tiene el título?", subtitle: "Sin título casi siempre está bien — solo díganos." },
      { title: "¿Enciende?", subtitle: "Sea honesto — los carros muertos todavía valen dinero." },
      { title: "¿Qué le queda puesto?", subtitle: "El motor, la transmisión y las piezas mueven la oferta." },
      { title: "¿Tiene daño?", subtitle: "Toque las partes chocadas o que faltan." },
      { title: "¿Dónde está?", subtitle: "Lo recogemos donde esté — la grúa siempre es gratis." },
      { title: "¿A dónde le mandamos la oferta?", subtitle: "Le mandamos su número garantizado por texto y correo." },
    ],
    guaranteed: "Oferta garantizada", step: "Paso", of: "de",
    back: "Atrás", cont: "Continuar", submit: "Ver mi oferta", submitting: "Buscando su oferta…",
    vin: "VIN (opcional)", mileage: "Millaje (opcional)",
    titles: { clean: "Título limpio", salvage: "Título de salvamento", rebuilt: "Título reconstruido", no_title: "Sin título" },
    runs: "¿Camina el carro?", starts: "¿Prende el motor?",
    wheels: "¿Tiene las cuatro llantas puestas?", tires: "¿Las llantas tienen aire?",
    whichFlat: "¿Cuáles están ponchadas?",
    flat: { front: "Adelante", rear: "Atrás", both: "Las dos puntas" },
    flatHint: "Decide qué grúa mandamos, así no perdemos un viaje.",
    engine: "Motor", trans: "Transmisión",
    cat: "¿Tiene el convertidor catalítico?", battery: "¿Tiene batería?", keys: "¿Tiene las llaves?",
    zip: "Código postal", address: "Dirección de recogida (opcional)",
    addressHint: "Puede dejarlo en blanco y se lo preguntamos al programar la recogida.",
    phone: "Teléfono", email: "Correo electrónico",
    phoneReq: "El teléfono es obligatorio", phoneBad: "Ponga un teléfono válido de 10 dígitos",
    emailReq: "El correo es obligatorio", emailBad: "Ponga un correo válido",
    contactHint: "Le mandamos la oferta por texto y la confirmación por correo. Los dos son obligatorios.",
    footer: "Grúa gratis · Sin cargos · Le pagamos al recoger",
    yes: "Sí", no: "No",
    choice: { intact: "completo", partial: "parcial", missing: "falta" },
  },
} as const;


type Form = {
  vehicle: VehicleSelection;
  vin: string;
  vehicle_lookup_token?: string;
  mileage: string;
  title_status: string;
  runs: boolean | null;
  starts: boolean | null;
  all_wheels_attached: boolean | null;
  all_tires_inflated: boolean | null;
  flat_tire_position: "front" | "rear" | "both" | "";
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
                ? "border-brand-600 bg-brand-600 text-white shadow-sm"
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
              ? "border-brand-600 bg-brand-600 text-white shadow-sm"
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
  const lang: Lang = sp.get("lang") === "es" ? "es" : "en";
  const t = T[lang];
  const [step, setStep] = useState(0);
  const [vehicleRevision, setVehicleRevision] = useState(0);
  const [form, setForm] = useState<Form>({
    vehicle: EMPTY_VEHICLE,
    vin: "",
    mileage: "",
    title_status: "",
    runs: null, starts: null,
    all_wheels_attached: null, all_tires_inflated: null,
    flat_tire_position: "",
    engine_state: "", transmission_state: "",
    has_catalytic: null, has_battery: null, has_keys: null,
    damage_zones: EMPTY_DAMAGE,
    zip_code: "", pickup_address: "", phone: "", email: "",
  });
  const [touched, setTouched] = useState<{ phone: boolean; email: boolean }>({
    phone: false,
    email: false,
  });
  // The homepage already asked for year, make and model. Carry those in and
  // start on the next question instead of asking the same thing twice —
  // George, on hitting the live page: "it asks you the same questions again".
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
        vin: form.vin.trim() || undefined,
        vehicle_lookup_token: form.vehicle_lookup_token,
        year: v.year ?? 0,
        make: v.make_name ?? "",
        model: v.model_name ?? "",
        condition: conditionFromAnswers(),
        title_status: form.title_status,
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
        flat_tire_position:
          form.all_tires_inflated === true ? "none"
          : form.flat_tire_position || undefined,
        engine_state: form.engine_state || undefined,
        transmission_state: form.transmission_state || undefined,
        has_catalytic: form.has_catalytic ?? undefined,
        has_battery: form.has_battery ?? undefined,
        has_keys: form.has_keys ?? undefined,
        damage_zones: form.damage_zones,
        contact_phone: form.phone,
        contact_email: form.email,
      });
      trackLeadSubmission(result.offer_id);
      const q = new URLSearchParams({
        id: String(result.offer_id),
        status: String(result.status ?? ""),
      });
      // Carry the number and token straight over so the seller sees a price
      // instantly instead of a spinner waiting on a status that may never come.
      if (result.offer_cents) q.set("cents", String(result.offer_cents));
      if (result.token) q.set("token", String(result.token));
      if (lang === "es") q.set("lang", "es");
      router.push(`/quote/result?${q.toString()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance = (() => {
    if (step === 0) return !!(form.vehicle.year && form.vehicle.make_name && form.vehicle.model_name);
    if (step === 1) return !!form.title_status;
    if (step === 2) return form.runs !== null && form.starts !== null
                           && form.all_wheels_attached !== null
                           && (form.all_tires_inflated !== false
                               || form.flat_tire_position !== "");
    if (step === 3) return !!form.engine_state && !!form.transmission_state
                           && form.has_catalytic !== null
                           && form.has_battery !== null && form.has_keys !== null;
    if (step === 4) return true;
    if (step === 5) return form.zip_code.length >= 5;
    if (step === 6) return isValidPhone(form.phone) && isValidEmail(form.email);
    return false;
  })();

  const phoneError = touched.phone && !isValidPhone(form.phone)
    ? (form.phone.trim() === "" ? t.phoneReq : t.phoneBad)
    : null;
  const emailError = touched.email && !isValidEmail(form.email)
    ? (form.email.trim() === "" ? t.emailReq : t.emailBad)
    : null;

  const pct = Math.round(((step + 1) / STEPS.length) * 100);
  const meta = t.steps[step];

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <Logo height={30} />
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <ShieldCheck className="h-4 w-4 text-brand-600" /> {t.guaranteed}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
        {/* progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-[0.16em] text-brand-700 ${mono}`}>
              {t.step} {step + 1} {t.of} {STEPS.length}
            </span>
            <span className={`text-xs font-semibold text-zinc-400 ${mono}`}>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* what the homepage already told us */}
        {form.vehicle.year && form.vehicle.make_name && form.vehicle.model_name && step > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <span className="text-sm font-semibold text-brand-800">
              {form.vehicle.year} {form.vehicle.make_name} {form.vehicle.model_name}
            </span>
            <button type="button" onClick={() => setStep(0)}
              className="text-xs font-semibold text-brand-700 underline">
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
              <VehicleAutofill lang={lang} revision={vehicleRevision}
                onResolved={(v, token) => setForm(current => ({ ...current, vin: v.vin,
                  vehicle_lookup_token: token,
                  vehicle: { year: v.year, make_id: null, make_name: v.make,
                    model_id: null, model_name: v.model, trim: v.trim || "" } }))} />
              <VehiclePicker
                value={form.vehicle}
                onChange={(v) => { setVehicleRevision(n => n + 1); setForm({ ...form, vehicle: v, vehicle_lookup_token: undefined }); }}
              />
              <div>
                <Label>{t.vin}</Label>
                <Input value={form.vin} onChange={(e) => {
                  setVehicleRevision(n => n + 1);
                  setForm({ ...form, vin: e.target.value, vehicle_lookup_token: undefined }); }} />
              </div>
              <div>
                <Label>{t.mileage}</Label>
                <Input type="number" value={form.mileage} onChange={(e) =>
                  setForm({ ...form, mileage: e.target.value })} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2.5">
              {(["clean", "salvage", "rebuilt", "no_title"] as const).map((ts) => (
                <button
                  key={ts}
                  type="button"
                  onClick={() => setForm({ ...form, title_status: ts })}
                  className={`flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left text-sm font-semibold capitalize transition
                    ${form.title_status === ts
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}
                >
                  {t.titles[ts]}
                  {form.title_status === ts && <Check className="h-5 w-5 text-brand-600" />}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <YesNo label={t.runs}
                value={form.runs}
                onChange={(v) => setForm({ ...form, runs: v })} />
              <YesNo label={t.starts}
                value={form.starts}
                onChange={(v) => setForm({ ...form, starts: v })} />
              <YesNo label={t.wheels}
                value={form.all_wheels_attached}
                onChange={(v) => setForm({ ...form, all_wheels_attached: v })} />
              <YesNo label={t.tires}
                value={form.all_tires_inflated}
                onChange={(v) => setForm({
                  ...form,
                  all_tires_inflated: v,
                  // Saying they are all up clears any earlier answer.
                  flat_tire_position: v ? "" : form.flat_tire_position,
                })} />

              {/* Which axle decides whether we send a wheel-lift or a flatbed. */}
              {form.all_tires_inflated === false && (
                <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
                  <Label className="text-sm font-medium text-zinc-800">
                    {t.whichFlat}
                  </Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(["front", "rear", "both"] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setForm({ ...form, flat_tire_position: k })}
                        className={`h-11 rounded-xl border text-sm font-semibold transition
                          ${form.flat_tire_position === k
                            ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                            : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"}`}
                      >
                        {t.flat[k]}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-600">{t.flatHint}</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-zinc-700">{t.engine}</Label>
                <div className="mt-2">
                  <ChoiceRow options={["intact", "partial", "missing"] as const}
                    value={form.engine_state}
                    onChange={(s) => setForm({ ...form, engine_state: s as Form["engine_state"] })} />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-zinc-700">{t.trans}</Label>
                <div className="mt-2">
                  <ChoiceRow options={["intact", "partial", "missing"] as const}
                    value={form.transmission_state}
                    onChange={(s) => setForm({ ...form, transmission_state: s as Form["transmission_state"] })} />
                </div>
              </div>
              <YesNo label={t.cat}
                value={form.has_catalytic}
                onChange={(v) => setForm({ ...form, has_catalytic: v })} />
              <YesNo label={t.battery}
                value={form.has_battery}
                onChange={(v) => setForm({ ...form, has_battery: v })} />
              <YesNo label={t.keys}
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
              <div>
                <Label>{t.zip}</Label>
                <Input value={form.zip_code} onChange={(e) =>
                  setForm({ ...form, zip_code: e.target.value })} />
              </div>
              <div>
                <Label>{t.address}</Label>
                <Input
                  value={form.pickup_address}
                  onChange={(e) =>
                    setForm({ ...form, pickup_address: e.target.value })
                  }
                  placeholder="Street, city, state — we'll confirm later"
                />
              </div>
              <p className="text-xs text-zinc-500">
                {t.addressHint}
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">
                  {t.phone} <span className="text-red-600">*</span>
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
                  {t.email} <span className="text-red-600">*</span>
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
              <p className="text-xs text-zinc-500">
                {t.contactHint}
              </p>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {/* nav */}
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <Button variant="outline" className="h-12 gap-1.5 px-4"
              onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="h-4 w-4" /> {t.back}
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button className="h-12 flex-1 text-base font-semibold" disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}>{t.cont}</Button>
          ) : (
            <Button className="h-12 flex-1 text-base font-bold" disabled={!canAdvance || submitting}
              onClick={submit}>
              {submitting ? t.submitting : t.submit}
            </Button>
          )}
        </div>

        <p className="mt-5 text-center text-xs text-zinc-400">
          {t.footer}
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
