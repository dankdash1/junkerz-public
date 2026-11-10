"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import OnboardingChecklist from "@/components/buyers/OnboardingChecklist";
import { buyerApi, BuyerSignupBody, OnboardingStatus } from "@/lib/buyer-api";
import { useBuyerLang } from "@/lib/buyer-lang";
import { buyerText, serverWords, type SignupField } from "@/components/buyers/buyerText";

type FieldKey = SignupField;

export default function BuyerSignup() {
  const router = useRouter();
  const [form, setForm] = useState<Required<Omit<BuyerSignupBody, "form_ticket" | "confirm_site" | "preferred_language">>>({
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
  // English or Español: the whole page follows the switch at the top of the
  // buyer pages, and the account is created with it (2026-11-10).
  const [lang] = useBuyerLang({ account: false });
  const T = buyerText(lang);
  const t = T.signup;
  // Load problems are kept as a key so they change language with the switch.
  const [configFailed, setConfigFailed] = useState(false);
  const [checklist, setChecklist] = useState<OnboardingStatus | null>(null);
  const [requiredFields, setRequiredFields] = useState<FieldKey[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Robot check: the server's signed ticket for this visit, and a box people never see.
  const ticket = useRef<string>("");
  const trap = useRef<HTMLInputElement>(null);

  useEffect(() => {
    buyerApi
      .signupConfig()
      .then((cfg) => { ticket.current = cfg.form_ticket ?? ""; setRequiredFields((cfg.required_fields || []) as FieldKey[]); setChecklist(cfg.onboarding); })
      .catch(() => setConfigFailed(true));
  }, []);

  const isRequired = (k: FieldKey) =>
    k === "business_name" || k === "login_email" || k === "password" ||
    requiredFields.includes(k);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setConfigFailed(false);
    try {
      // 1. Create the account
      const body: BuyerSignupBody = {
        email: form.email,
        password: form.password,
        business_name: form.business_name,
        form_ticket: ticket.current,
        confirm_site: trap.current?.value ?? "",
        preferred_language: lang,
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
      const created = await buyerApi.signup(body);
      // Only a real account number means something was saved.
      if (!created?.buyer_id) throw new Error("check_form");

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
      const code = (e as Error)?.message;
      // A failed press may have used up this visit's ticket; fetch a fresh one
      // so pressing Create again works. "too_fast" leaves the ticket unused.
      if (code !== "too_fast") {
        buyerApi.signupConfig().then((cfg) => { ticket.current = cfg.form_ticket ?? ""; }).catch(() => {});
      }
      setErr(code || "?");
    } finally {
      setBusy(false);
    }
  }

  const lbl = (k: FieldKey) =>
    `${t.fields[k]}${isRequired(k) ? " *" : ""}`;
  // The error is kept as the server's code and turned into words here, so it
  // follows the language switch too.
  const errText = configFailed ? t.configFailed : err ? serverWords(T, t.server, err) : null;

  return (
    <main className="max-w-xl mx-auto pt-12 px-6 pb-16" lang={lang}>
      <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
      {/* George 2026-11-10: short form first. Name + address up front, the rest
          folds away. Papers can be skipped now; a photo ID and a card are needed
          before a yard can win cars. */}
      <p className="text-sm text-slate-600 mb-4">{t.intro}</p>

      {checklist && (
        <details className="mb-6 rounded-lg border border-slate-200 bg-white p-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">
            {t.needBefore}
          </summary>
          <div className="mt-3"><OnboardingChecklist status={checklist} preview lang={lang} /></div>
        </details>
      )}
      <form onSubmit={submit} className="space-y-6">
        {/* Robot trap: hidden from people and screen readers; robots fill it. */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
          <label htmlFor="confirm_site">Leave this empty</label>
          <input id="confirm_site" name="confirm_site" type="text" tabIndex={-1} autoComplete="off" ref={trap} defaultValue="" />
        </div>
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">{t.loginSection}</h2>
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
          <h2 className="text-sm font-semibold text-slate-700 mb-3">{t.businessSection}</h2>
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
                placeholder={t.placeholders.contact_name}
              />
            </div>
            <div className="md:col-span-2">
              <Label>{lbl("address")}</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required={isRequired("address")}
                placeholder={t.placeholders.address}
              />
            </div>
            <div>
              <Label>{lbl("phone")}</Label>
              <Input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required={isRequired("phone")}
                placeholder={t.placeholders.phone}
              />
            </div>
            <details
              className="md:col-span-2 rounded-lg border border-slate-200 p-3"
              open={(["website", "license_number", "notification_email"] as FieldKey[]).some((k) => isRequired(k))}
            >
              <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                {t.moreDetails}
              </summary>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label htmlFor="sms_consent" className="flex items-start gap-2 text-sm text-slate-800">
                  <input
                    id="sms_consent"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                    checked={form.sms_consent}
                    onChange={(e) => setForm({ ...form, sms_consent: e.target.checked })}
                  />
                  <span>{t.smsBox}</span>
                </label>
                <p className="mt-2 text-xs text-slate-500">
                  {t.smsConsent}{" "}
                  <a href="/terms" className="underline">{t.termsLink}</a> {t.and}{" "}
                  <a href="/privacy-policy" className="underline">{t.privacyLink}</a>.
                </p>
              </div>
              <div>
                <Label>{lbl("website")}</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  required={isRequired("website")}
                  placeholder={t.placeholders.website}
                />
              </div>
              <div>
                <Label>{lbl("license_number")}</Label>
                <Input
                  value={form.license_number}
                  onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                  required={isRequired("license_number")}
                  placeholder={t.placeholders.license_number}
                />
              </div>
              <div className="md:col-span-2">
                <Label>{lbl("notification_email")}</Label>
                <Input
                  type="email"
                  value={form.notification_email}
                  onChange={(e) => setForm({ ...form, notification_email: e.target.value })}
                  required={isRequired("notification_email")}
                  placeholder={t.placeholders.notification_email}
                />
                <p className="text-xs text-slate-500 mt-1">{t.notificationHelp}</p>
              </div>
              </div>
            </details>
          </div>
        </section>

        {errText && <p className="text-red-600 text-sm">{errText}</p>}

        <Button className="w-full" type="submit" disabled={busy}>
          {busy ? t.creating : t.submit}
        </Button>
        <p className="text-xs text-slate-500 text-center">{t.footer}</p>
      </form>
    </main>
  );
}
