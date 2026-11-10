"use client";
// The bid-rule form, shared by /buyers/bid-rules/new and /buyers/bid-rules/[id]
// (2026-11-09 rebuild: George's approved "what cars do you want" layout).
// The two pages used to carry two copies of every field. One copy now, in English
// or Spanish, and Save ends in a green "Saved" (read back from the server) or a red
// "Not saved" with the reason.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";
import { useBuyerLang, type Lang } from "@/lib/buyer-lang";
import { ruleText, serverProblem, type RuleText } from "@/components/buyers/ruleText";
import { VehicleTypesField, WhereField, parseZipList, whereProblem } from "@/components/buyers/RuleFields";
import VehicleWantsField from "@/components/buyers/VehicleWantsField";
import {
  emptyWants,
  wantsFromRule,
  wantsPayload,
  wantsProblem,
  type RuleVehicleFields,
  type WantsState,
} from "@/lib/rule-wants";

const CONDITIONS = ["runs", "starts_no_drive", "dead", "wrecked"];
const TITLES = ["clean", "salvage", "rebuilt", "no_title"];
const PICKUP_PAYORS = ["buyer", "junkerz", "split"];
const ENGINE_STATES = ["intact", "partial", "missing"];
const CHANNELS = ["telegram", "email", "sms"] as const;
const PRIORITIES = [0, 1, 5, 10];

export type BidRuleResponse = RuleVehicleFields & {
  id: number;
  name?: string | null;
  bid_cents: number;
  active: boolean;
  conditions?: string[] | null;
  title_statuses?: string[] | null;
  zip_codes?: string[] | null;
  weekly_budget_cents?: number | null;
  zip_center?: string | null;
  zip_radius_miles?: number | null;
  max_per_day?: number | null;
  max_per_week?: number | null;
  max_per_month?: number | null;
  daily_count_used?: number | null;
  weekly_count_used?: number | null;
  monthly_count_used?: number | null;
  pickup_paid_by?: string | null;
  priority?: number | null;
  notification_preference?: string[] | null;
  require_runs?: boolean | null;
  require_starts?: boolean | null;
  min_wheels?: number | null;
  require_engine_state?: string[] | null;
  require_battery?: boolean | null;
  require_keys?: boolean | null;
  area_codes?: string[] | null;
  vehicle_category?: string | null;
  vehicle_categories?: string[] | null;
  exclude_flood?: boolean | null;
  exclude_fire?: boolean | null;
  max_damage_zones?: number | null;
};

type FormState = {
  name: string;
  bid_dollars: string;
  active: boolean;
  vehicle_categories: string[];
  conditions: string[];
  title_statuses: string[];
  zip_codes: string;
  zip_center: string;
  zip_radius_miles: string;
  area_codes: string[];
  weekly_budget_dollars: string;
  max_per_day: string;
  max_per_week: string;
  max_per_month: string;
  pickup_paid_by: string;
  priority: number;
  notification_preference: string[];
  require_runs: boolean | null;
  require_starts: boolean | null;
  min_wheels: null | 2 | 4;
  require_engine_state: string[];
  require_battery: boolean | null;
  require_keys: boolean | null;
  exclude_flood: boolean;
  exclude_fire: boolean;
  max_damage_zones: string;
};

const NEW_FORM: FormState = {
  name: "",
  bid_dollars: "",
  active: true,
  vehicle_categories: [],
  conditions: ["runs"],
  title_statuses: ["clean"],
  zip_codes: "",
  zip_center: "",
  zip_radius_miles: "",
  area_codes: [],
  weekly_budget_dollars: "",
  max_per_day: "",
  max_per_week: "",
  max_per_month: "",
  pickup_paid_by: "buyer",
  priority: 0,
  notification_preference: ["telegram"],
  require_runs: null,
  require_starts: null,
  min_wheels: null,
  require_engine_state: [],
  require_battery: null,
  require_keys: null,
  exclude_flood: false,
  exclude_fire: false,
  max_damage_zones: "",
};

function formFromRule(r: BidRuleResponse): FormState {
  return {
    name: r.name ?? "",
    bid_dollars: ((r.bid_cents ?? 0) / 100).toFixed(2),
    active: !!r.active,
    // Older rules kept one type in vehicle_category; show it, then save it back
    // as the list so the two can never disagree.
    vehicle_categories: r.vehicle_categories ?? (r.vehicle_category ? [r.vehicle_category] : []),
    conditions: r.conditions ?? ["runs"],
    title_statuses: r.title_statuses ?? ["clean"],
    zip_codes: (r.zip_codes ?? []).join(", "),
    zip_center: r.zip_center ?? "",
    zip_radius_miles: r.zip_radius_miles != null ? String(r.zip_radius_miles) : "",
    area_codes: r.area_codes ?? [],
    max_per_day: r.max_per_day != null ? String(r.max_per_day) : "",
    max_per_week: r.max_per_week != null ? String(r.max_per_week) : "",
    max_per_month: r.max_per_month != null ? String(r.max_per_month) : "",
    weekly_budget_dollars:
      r.weekly_budget_cents != null ? (r.weekly_budget_cents / 100).toFixed(2) : "",
    pickup_paid_by: r.pickup_paid_by ?? "buyer",
    priority: r.priority ?? 0,
    notification_preference: (r.notification_preference ?? ["telegram"]).filter(
      (c): c is string => typeof c === "string",
    ),
    require_runs: r.require_runs ?? null,
    require_starts: r.require_starts ?? null,
    min_wheels: r.min_wheels === 2 || r.min_wheels === 4 ? r.min_wheels : null,
    require_engine_state: r.require_engine_state ?? [],
    require_battery: r.require_battery ?? null,
    require_keys: r.require_keys ?? null,
    exclude_flood: !!r.exclude_flood,
    exclude_fire: !!r.exclude_fire,
    max_damage_zones: r.max_damage_zones != null ? String(r.max_damage_zones) : "",
  };
}

class FormProblem extends Error {}

function buildPayload(form: FormState, wants: WantsState, t: RuleText, lang: Lang, edit: boolean) {
  const bid_cents = Math.round(parseFloat(form.bid_dollars) * 100);
  if (!Number.isFinite(bid_cents) || bid_cents <= 0) throw new FormProblem(t.badBid);
  const wp = wantsProblem(wants);
  if (wp) {
    throw new FormProblem(
      wp.kind === "needOneMake" ? t.needOneMake
        : wp.kind === "cardNeedsMake" ? t.cardNeedsMake
          : wp.kind === "cardYearOrder" ? t.cardYearOrder(wp.make)
            : t.yearOrder,
    );
  }
  const where = whereProblem(form, lang);
  if (where) throw new FormProblem(where);
  const zips = parseZipList(form.zip_codes);
  const payload: Record<string, unknown> = {
    name: form.name || null,
    bid_cents,
    vehicle_categories: form.vehicle_categories.length ? form.vehicle_categories : null,
    ...wantsPayload(wants),
    conditions: form.conditions,
    title_statuses: form.title_statuses,
    zip_codes: zips.length ? zips : null,
    zip_center: form.zip_center.trim() || null,
    area_codes: form.area_codes.length ? form.area_codes : null,
    zip_radius_miles: form.zip_radius_miles ? parseInt(form.zip_radius_miles, 10) : null,
    weekly_budget_cents: form.weekly_budget_dollars
      ? Math.round(parseFloat(form.weekly_budget_dollars) * 100)
      : null,
    max_per_day: form.max_per_day ? parseInt(form.max_per_day, 10) : null,
    max_per_week: form.max_per_week ? parseInt(form.max_per_week, 10) : null,
    max_per_month: form.max_per_month ? parseInt(form.max_per_month, 10) : null,
    pickup_paid_by: form.pickup_paid_by,
    priority: form.priority,
    require_runs: form.require_runs,
    require_starts: form.require_starts,
    min_wheels: form.min_wheels,
    require_engine_state: form.require_engine_state.length ? form.require_engine_state : null,
    require_transmission_state: null,
    require_battery: form.require_battery,
    require_keys: form.require_keys,
    // Catalytic converter is hidden on the form for now; saving clears it so a
    // filter the buyer cannot see never rejects cars.
    has_catalytic: null,
    exclude_flood: form.exclude_flood,
    exclude_fire: form.exclude_fire,
    max_damage_zones: form.max_damage_zones ? parseInt(form.max_damage_zones, 10) : null,
  };
  if (edit) {
    payload.active = form.active;
    payload.vehicle_category = null;
    payload.notification_preference = form.notification_preference.length
      ? form.notification_preference
      : null;
  }
  return payload;
}

function YesAny({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  t: RuleText;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-40 text-slate-700">{label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          aria-pressed={value === true}
          onClick={() => onChange(value === true ? null : true)}
          className={`px-3 py-1 rounded border text-sm ${
            value === true ? "bg-brand-600 text-white border-brand-700" : "bg-white text-slate-700"
          }`}
        >
          {t.yes}
        </button>
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => onChange(null)}
          className={`px-3 py-1 rounded border text-sm ${
            value === null ? "bg-slate-200 text-slate-800 border-slate-400" : "bg-white text-slate-700"
          }`}
        >
          {t.any}
        </button>
      </div>
    </div>
  );
}

function LanguageSwitch({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex gap-1" role="group" aria-label="Language / Idioma">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          onClick={() => onChange(l)}
          className={`px-3 py-1 rounded border text-sm ${
            lang === l ? "bg-slate-800 text-white border-slate-900" : "bg-white text-slate-700"
          }`}
        >
          {l === "en" ? "English" : "Español"}
        </button>
      ))}
    </div>
  );
}

type Status = { kind: "saved" } | { kind: "error"; message: string } | null;

export default function BidRuleForm({ ruleId }: { ruleId?: number }) {
  const router = useRouter();
  const edit = ruleId != null;
  const [lang, setLang] = useBuyerLang();
  const t = ruleText(lang);

  const [loaded, setLoaded] = useState(!edit);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(NEW_FORM);
  const [wants, setWants] = useState<WantsState>(emptyWants);
  const [used, setUsed] = useState({ day: 0, week: 0, month: 0 });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [savedSnap, setSavedSnap] = useState<string | null>(null);
  const [backtest, setBacktest] = useState<{
    window_days: number; matched_offers: number; total_spend_cents: number;
  } | null>(null);

  const snap = (f: FormState, w: WantsState) =>
    JSON.stringify({ f, w: { ...w, cards: w.cards.map(({ key: _k, ...c }) => c) } });

  function hydrate(r: BidRuleResponse) {
    const f = formFromRule(r);
    const w = wantsFromRule(r);
    setForm(f);
    setWants(w);
    setUsed({
      day: r.daily_count_used ?? 0,
      week: r.weekly_count_used ?? 0,
      month: r.monthly_count_used ?? 0,
    });
    return snap(f, w);
  }

  useEffect(() => {
    if (!edit) return;
    let live = true;
    buyerApi
      .getRule(ruleId as number)
      .then((r: BidRuleResponse) => {
        if (!live) return;
        const s = hydrate(r);
        setLoaded(true);
        let justCreated = false;
        try {
          justCreated = new URLSearchParams(window.location.search).get("saved") === "1";
        } catch {
          /* no window */
        }
        if (justCreated) {
          setSavedSnap(s);
          setStatus({ kind: "saved" });
        }
      })
      .catch((e: Error) => live && setLoadErr(e?.message ?? "load failed"));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId]);

  function toggleArray(field: "conditions" | "title_statuses" | "require_engine_state", value: string) {
    setForm((f) => {
      const cur = f[field];
      return { ...f, [field]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });
  }

  async function save(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const payload = buildPayload(form, wants, t, lang, edit);
      if (!edit) {
        const created = await buyerApi.createRule(payload);
        const id = Number(created?.id);
        if (!Number.isFinite(id) || id <= 0) throw new Error("insert_failed");
        router.replace(`/buyers/bid-rules/${id}?saved=1`);
        return;
      }
      await buyerApi.updateRule(ruleId as number, payload);
      // Read the rule back so the page shows what the server holds, not what we sent.
      let s = snap(form, wants);
      try {
        s = hydrate(await buyerApi.getRule(ruleId as number));
      } catch {
        /* the save itself succeeded */
      }
      setSavedSnap(s);
      setStatus({ kind: "saved" });
    } catch (err: unknown) {
      const message =
        err instanceof FormProblem ? err.message : serverProblem(t, (err as Error)?.message);
      setStatus({ kind: "error", message });
    } finally {
      setBusy(false);
    }
  }

  async function runBacktest() {
    setBusy(true);
    try {
      setBacktest(await buyerApi.testRule(ruleId as number));
    } catch (err: unknown) {
      setStatus({ kind: "error", message: serverProblem(t, (err as Error)?.message) });
    } finally {
      setBusy(false);
    }
  }

  if (loadErr) return <main className="p-12 text-red-600">{loadErr}</main>;
  if (!loaded) return <main className="p-12">{t.loading}</main>;

  const showSaved = status?.kind === "saved" && savedSnap === snap(form, wants);
  const pick = (on: boolean) =>
    `px-3 py-1 rounded border text-sm ${on ? "bg-brand-600 text-white border-brand-700" : "bg-white text-slate-700"}`;

  return (
    <main className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6" lang={lang}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{edit ? t.titleEdit(ruleId as number) : t.titleNew}</h1>
        <LanguageSwitch lang={lang} onChange={setLang} />
      </div>
      <form onSubmit={save} className="space-y-4 bg-white rounded shadow p-4 sm:p-6">
        <div>
          <Label htmlFor="rule-name">{t.name}</Label>
          <Input
            id="rule-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t.namePlaceholder}
          />
        </div>
        <div>
          <Label htmlFor="rule-bid">{t.bid}</Label>
          <Input
            id="rule-bid"
            type="number"
            step="0.01"
            min="0.01"
            value={form.bid_dollars}
            onChange={(e) => setForm({ ...form, bid_dollars: e.target.value })}
            required
          />
        </div>

        {edit && (
          <>
            <div className="flex items-center gap-3">
              <Label className="mb-0">{t.status}</Label>
              <button
                type="button"
                onClick={() => setForm({ ...form, active: !form.active })}
                aria-pressed={form.active}
                className={`px-4 py-1 rounded border text-sm font-semibold ${
                  form.active ? "bg-brand-600 text-white border-brand-700" : "bg-slate-200 text-slate-700 border-slate-300"
                }`}
              >
                {form.active ? t.active : t.paused}
              </button>
            </div>
            <div>
              <Label>{t.priority}</Label>
              <div className="flex gap-2 mt-1">
                {PRIORITIES.map((p) => (
                  <button type="button" key={p} onClick={() => setForm({ ...form, priority: p })} className={pick(form.priority === p)}>
                    {t.priorities[p]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">{t.priorityHelp}</p>
            </div>
            <div>
              <Label>{t.channels}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CHANNELS.map((ch) => {
                  const checked = form.notification_preference.includes(ch);
                  return (
                    <button
                      type="button"
                      key={ch}
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() =>
                        setForm({
                          ...form,
                          notification_preference: checked
                            ? form.notification_preference.filter((c) => c !== ch)
                            : [...form.notification_preference, ch],
                        })
                      }
                      className={`${pick(checked)} flex items-center gap-1`}
                    >
                      <span aria-hidden>{checked ? "☑" : "☐"}</span>
                      {t.channelNames[ch]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-1">{t.channelsHelp}</p>
            </div>
          </>
        )}

        <VehicleTypesField
          value={form.vehicle_categories}
          onChange={(v) => setForm((f) => ({ ...f, vehicle_categories: v }))}
          lang={lang}
        />
        <VehicleWantsField value={wants} onChange={setWants} types={form.vehicle_categories} lang={lang} />

        <div>
          <Label>{t.conditions}</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CONDITIONS.map((c) => (
              <button type="button" key={c} onClick={() => toggleArray("conditions", c)} className={pick(form.conditions.includes(c))}>
                {t.conditionNames[c]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>{t.titles}</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {TITLES.map((x) => (
              <button type="button" key={x} onClick={() => toggleArray("title_statuses", x)} className={pick(form.title_statuses.includes(x))}>
                {t.titleNames[x]}
              </button>
            ))}
          </div>
        </div>
        <WhereField value={form} onChange={(patch) => setForm((f) => ({ ...f, ...patch }))} lang={lang} />
        <div>
          <Label htmlFor="rule-budget">{t.weeklyBudget}</Label>
          <Input
            id="rule-budget"
            type="number"
            step="0.01"
            value={form.weekly_budget_dollars}
            onChange={(e) => setForm({ ...form, weekly_budget_dollars: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([
            ["max_per_day", t.maxDay],
            ["max_per_week", t.maxWeek],
            ["max_per_month", t.maxMonth],
          ] as const).map(([k, label]) => (
            <div key={k}>
              <Label htmlFor={`rule-${k}`}>{label}</Label>
              <Input
                id={`rule-${k}`}
                type="number"
                min="1"
                value={form[k]}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                placeholder={t.any}
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 -mt-1">
          {edit ? t.capsUsed(used.day, used.week, used.month) : t.capsHelpNew}
        </p>

        <div>
          <Label>{t.whoPays}</Label>
          <div className="flex gap-2 mt-1">
            {PICKUP_PAYORS.map((p) => (
              <button type="button" key={p} onClick={() => setForm({ ...form, pickup_paid_by: p })} className={pick(form.pickup_paid_by === p)}>
                {t.payorNames[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h2 className="font-semibold text-slate-800">{t.conditionFilters}</h2>
          <YesAny t={t} label={t.requireRuns} value={form.require_runs} onChange={(v) => setForm({ ...form, require_runs: v })} />
          <YesAny t={t} label={t.requireStarts} value={form.require_starts} onChange={(v) => setForm({ ...form, require_starts: v })} />
          <div className="flex items-center gap-3">
            <span className="text-sm w-40 text-slate-700">{t.minWheels}</span>
            <div className="flex gap-1">
              {([null, 2, 4] as (null | 2 | 4)[]).map((v) => (
                <button type="button" key={String(v)} onClick={() => setForm({ ...form, min_wheels: v })} className={pick(form.min_wheels === v)}>
                  {v === null ? t.any : `${v}+`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-sm text-slate-700">{t.engineStates}</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {ENGINE_STATES.map((s) => (
                <button type="button" key={s} onClick={() => toggleArray("require_engine_state", s)} className={pick(form.require_engine_state.includes(s))}>
                  {t.engineNames[s]}
                </button>
              ))}
              <span className="text-xs text-slate-400 self-center">{t.blankAny}</span>
            </div>
          </div>
          <YesAny t={t} label={t.battery} value={form.require_battery} onChange={(v) => setForm({ ...form, require_battery: v })} />
          <YesAny t={t} label={t.keys} value={form.require_keys} onChange={(v) => setForm({ ...form, require_keys: v })} />
          {([
            ["exclude_flood", t.excludeFlood],
            ["exclude_fire", t.excludeFire],
          ] as const).map(([k, label]) => (
            <div key={k} className="flex items-center gap-3">
              <span className="text-sm w-40 text-slate-700">{label}</span>
              <button
                type="button"
                aria-pressed={form[k]}
                onClick={() => setForm({ ...form, [k]: !form[k] })}
                className={`px-3 py-1 rounded border text-sm ${
                  form[k] ? "bg-red-600 text-white border-red-700" : "bg-white text-slate-700"
                }`}
              >
                {form[k] ? t.excluded : t.allow}
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <label className="text-sm w-40 text-slate-700" htmlFor="rule-damage">{t.maxDamage}</label>
            <Input
              id="rule-damage"
              type="number"
              min="0"
              className="w-24"
              placeholder={t.any}
              value={form.max_damage_zones}
              onChange={(e) => setForm({ ...form, max_damage_zones: e.target.value })}
            />
          </div>
        </div>

        {showSaved && (
          <p role="status" className="text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded p-2">
            ✓ {t.saved}
          </p>
        )}
        {status?.kind === "error" && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-300 rounded p-2">
            <strong>{t.notSaved}:</strong> {status.message}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={busy} className="flex-1">
            {busy ? t.saving : t.save}
          </Button>
          {edit && (
            <Button type="button" variant="outline" onClick={runBacktest} disabled={busy}>
              {t.backtest}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => router.replace("/buyers/bid-rules")}>
            {edit ? t.backToRules : t.cancel}
          </Button>
        </div>
      </form>

      {backtest && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-2">{t.backtestTitle}</h2>
          <p className="text-slate-700">
            {t.backtestResult(
              backtest.window_days,
              backtest.matched_offers,
              (backtest.total_spend_cents / 100).toFixed(0),
            )}
          </p>
        </div>
      )}
    </main>
  );
}

// Exported for tests.
export { buildPayload, formFromRule };
