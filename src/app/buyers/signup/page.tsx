"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OnboardingChecklist from "@/components/buyers/OnboardingChecklist";
import { buyerApi, BuyerSignupBody, OnboardingStatus } from "@/lib/buyer-api";

type FieldKey =
  | "business_name" | "login_email" | "password"
  | "contact_name" | "address" | "phone"
  | "website" | "license_number" | "notification_email";

const FIELD_LABELS: Record<FieldKey, string> = {
  business_name: "Business name",
  login_email: "Login email",
  password: "Password",
  contact_name: "Contact name",
  address: "Yard address",
  phone: "Phone",
  website: "Website",
  license_number: "License number",
  notification_email: "Notification email",
};

export default function BuyerSignup() {
  const router = useRouter();
  const [form, setForm] = useState<Required<BuyerSignupBody>>({
    email: "",
    password: "",
    business_name: "",
    contact_name: "",
    address: "",
    phone: "",
    website: "",
    license_number: "",
    notification_email: "",
    sms_consent: false,
  });
  const [checklist, setChecklist] = useState<OnboardingStatus | null>(null);
  const [requiredFields, setRequiredFields] = useState<FieldKey[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    buyerApi
      .signupConfig()
      .then((cfg) => { setRequiredFields((cfg.required_fields || []) as FieldKey[]); setChecklist(cfg.onboarding); })
      .catch(() => setErr("Unable to load onboarding requirements. Please reload before signing up."));
  }, []);

  const isRequired = (k: FieldKey) =>
    k === "business_name" || k === "login_email" || k === "password" ||
    requiredFields.includes(k);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      // 1. Create the account
      const body: BuyerSignupBody = {
        email: form.email,
        password: form.password,
        business_name: form.business_name,
      };
      // Only send the optional fields that have a value
      const optional: (keyof BuyerSignupBody)[] = [
        "contact_name", "address", "phone", "website",
        "license_number", "notification_email",
      ];
      for (const k of optional) {
        const v = form[k as keyof typeof form];
        if (v) (body as Record<string, unknown>)[k] = v;
      }
      // Sent only as a real tick. Unchecked means we never text this buyer.
      if (form.sms_consent === true) body.sms_consent = true;
      await buyerApi.signup(body);

      // 2. Auto-login so the buyer can upload documents on the next step
      try {
        const r = await buyerApi.login(form.email, form.password);
        if (r?.token) {
          window.localStorage.setItem("buyer_token", r.token);
          router.replace("/buyers/signup/documents");
          return;
        }
      } catch {
        /* fall through — show generic 'pending' state below */
      }
      // If auto-login failed (rare), still treat signup as done.
      router.replace("/buyers/login?signed_up=1");
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  const lbl = (k: FieldKey) =>
    `${FIELD_LABELS[k]}${isRequired(k) ? " *" : ""}`;

  return (
    <main className="max-w-xl mx-auto pt-12 px-6 pb-16">
      <h1 className="text-2xl font-bold mb-2">Create Junkerz Buyer Account</h1>
      <p className="text-sm text-slate-600 mb-6">
        Fill in your business profile. After creating your account you&apos;ll be asked to
        complete the checklist below. Documents marked optional are requested for review.
      </p>

      {checklist && <div className="mb-6"><OnboardingChecklist status={checklist} preview /></div>}
      <form onSubmit={submit} className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Login credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>{lbl("login_email")}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{lbl("password")}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Business profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <Label>{lbl("business_name")}</Label>
              <Input
                value={form.business_name}
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{lbl("contact_name")}</Label>
              <Input
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                required={isRequired("contact_name")}
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <Label>{lbl("phone")}</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required={isRequired("phone")}
                placeholder="(555) 555-0100"
              />
            </div>
            <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label htmlFor="sms_consent" className="flex items-start gap-2 text-sm text-slate-800">
                <input
                  id="sms_consent"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                  checked={form.sms_consent}
                  onChange={(e) => setForm({ ...form, sms_consent: e.target.checked })}
                />
                <span>Yes, text me when I win a car, when a pickup is scheduled or rescheduled, and pickup reminders (optional).</span>
              </label>
              <p className="mt-2 text-xs text-slate-500">
                By checking this box and providing your phone number, you agree to receive SMS car-assignment,
                pickup and reminder messages from Junkerz. Message frequency may vary. Standard Message and Data
                Rates may apply. Reply STOP to opt out. Reply HELP for help. We will not share mobile information
                with third parties for promotional or marketing purposes. Leave the box unchecked and we contact you
                by email only. See our <a href="/terms" className="underline">Terms</a> and{" "}
                <a href="/privacy-policy" className="underline">Privacy Policy</a>.
              </p>
            </div>
            <div className="md:col-span-2">
              <Label>{lbl("address")}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required={isRequired("address")}
                placeholder="Street, City, State, ZIP"
              />
            </div>
            <div>
              <Label>{lbl("website")}</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                required={isRequired("website")}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label>{lbl("license_number")}</Label>
              <Input
                value={form.license_number}
                onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                required={isRequired("license_number")}
                placeholder="State dealer / dismantler #"
              />
            </div>
            <div className="md:col-span-2">
              <Label>{lbl("notification_email")}</Label>
              <Input
                type="email"
                value={form.notification_email}
                onChange={(e) => setForm({ ...form, notification_email: e.target.value })}
                required={isRequired("notification_email")}
                placeholder="Defaults to your login email if blank"
              />
              <p className="text-xs text-slate-500 mt-1">
                Where we send won-match notifications + reschedule alerts. Can differ
                from your login email.
              </p>
            </div>
          </div>
        </section>

        {err && <p className="text-red-600 text-sm">{err}</p>}

        <Button className="w-full" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account + continue"}
        </Button>
        <p className="text-xs text-slate-500 text-center">
          Fields marked * are required. Your account is approved by an admin before
          you can place bids.
        </p>
      </form>
    </main>
  );
}
