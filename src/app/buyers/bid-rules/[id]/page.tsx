"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buyerApi } from "@/lib/buyer-api";
import VehiclePicker, { VehicleSelection } from "@/components/VehiclePicker";

const CONDITIONS = ["runs", "starts_no_drive", "dead", "wrecked"];
const TITLES = ["clean", "salvage", "rebuilt", "no_title"];
const PICKUP_PAYORS = ["buyer", "junkerz", "split"];
const ENGINE_STATES = ["intact", "partial", "missing"];

const EMPTY_VEHICLE: VehicleSelection = {
  year: null,
  make_id: null,
  make_name: null,
  model_id: null,
  model_name: null,
  trim: "",
};

interface PickedMake {
  id: number;
  name: string;
}

interface PickedModel {
  id: number;
  name: string;
}

interface BidRuleResponse {
  id: number;
  name?: string;
  bid_cents: number;
  active: boolean;
  year_min?: number | null;
  year_max?: number | null;
  makes?: string[] | null;
  conditions?: string[];
  title_statuses?: string[];
  zip_codes?: string[] | null;
  weekly_budget_cents?: number | null;
  pickup_paid_by?: string;
  priority?: number;
  notification_preference?: string[] | null;
  make_ids?: number[] | null;
  model_ids?: number[] | null;
  require_runs?: boolean | null;
  require_starts?: boolean | null;
  min_wheels?: number | null;
  require_engine_state?: string[] | null;
  require_battery?: boolean | null;
  require_keys?: boolean | null;
  has_catalytic?: boolean | null;
  exclude_flood?: boolean;
  exclude_fire?: boolean;
  max_damage_zones?: number | null;
}

interface FormState {
  name: string;
  bid_dollars: string;
  active: boolean;
  year_min: string;
  year_max: string;
  makes: string;
  conditions: string[];
  title_statuses: string[];
  zip_codes: string;
  weekly_budget_dollars: string;
  pickup_paid_by: string;
  priority: number;
  notification_preference: string[];
  require_runs: boolean | null;
  require_starts: boolean | null;
  min_wheels: null | 2 | 4;
  require_engine_state: string[];
  require_battery: boolean | null;
  require_keys: boolean | null;
  require_catalytic: boolean | null;
  exclude_flood: boolean;
  exclude_fire: boolean;
  max_damage_zones: string;
}

interface BacktestResult {
  window_days: number;
  matched_offers: number;
  total_spend_cents: number;
}

function YesAny({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-40 text-slate-700">{label}</span>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange(value === true ? null : true)}
          className={`px-3 py-1 rounded border text-sm ${
            value === true
              ? "bg-emerald-600 text-white border-emerald-700"
              : "bg-white text-slate-700"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          className={`px-3 py-1 rounded border text-sm ${
            value === null
              ? "bg-slate-200 text-slate-800 border-slate-400"
              : "bg-white text-slate-700"
          }`}
        >
          Any
        </button>
      </div>
    </div>
  );
}

export default function EditBidRule() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    bid_dollars: "",
    active: true,
    year_min: "",
    year_max: "",
    makes: "",
    conditions: ["runs"],
    title_statuses: ["clean"],
    zip_codes: "",
    weekly_budget_dollars: "",
    pickup_paid_by: "buyer",
    priority: 0,
    notification_preference: ["telegram"],
    require_runs: null,
    require_starts: null,
    min_wheels: null,
    require_engine_state: [],
    require_battery: null,
    require_keys: null,
    require_catalytic: null,
    exclude_flood: false,
    exclude_fire: false,
    max_damage_zones: "",
  });

  const [picker, setPicker] = useState<VehicleSelection>(EMPTY_VEHICLE);
  const [pickedMakes, setPickedMakes] = useState<PickedMake[]>([]);
  const [pickedModels, setPickedModels] = useState<PickedModel[]>([]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [backtest, setBacktest] = useState<BacktestResult | null>(null);

  useEffect(() => {
    buyerApi
      .getRule(id)
      .then((r: BidRuleResponse) => {
        setForm({
          name: r.name ?? "",
          bid_dollars: ((r.bid_cents ?? 0) / 100).toFixed(2),
          active: !!r.active,
          year_min: r.year_min != null ? String(r.year_min) : "",
          year_max: r.year_max != null ? String(r.year_max) : "",
          makes: (r.makes ?? []).join(", "),
          conditions: r.conditions ?? ["runs"],
          title_statuses: r.title_statuses ?? ["clean"],
          zip_codes: (r.zip_codes ?? []).join(", "),
          weekly_budget_dollars:
            r.weekly_budget_cents != null
              ? (r.weekly_budget_cents / 100).toFixed(2)
              : "",
          pickup_paid_by: r.pickup_paid_by ?? "buyer",
          priority: r.priority ?? 0,
          notification_preference: (r.notification_preference ?? ["telegram"]).filter(
            (c): c is string => typeof c === "string",
          ),
          require_runs: r.require_runs ?? null,
          require_starts: r.require_starts ?? null,
          min_wheels: (r.min_wheels === 2 || r.min_wheels === 4 ? r.min_wheels : null),
          require_engine_state: r.require_engine_state ?? [],
          require_battery: r.require_battery ?? null,
          require_keys: r.require_keys ?? null,
          require_catalytic: r.has_catalytic ?? null,
          exclude_flood: !!r.exclude_flood,
          exclude_fire: !!r.exclude_fire,
          max_damage_zones:
            r.max_damage_zones != null ? String(r.max_damage_zones) : "",
        });
        // Hydrate chip pickers from ids (name not returned in v1 — label as "ID #N")
        if (r.make_ids?.length) {
          setPickedMakes(r.make_ids.map((mid) => ({ id: mid, name: `Make #${mid}` })));
        }
        if (r.model_ids?.length) {
          setPickedModels(r.model_ids.map((mid) => ({ id: mid, name: `Model #${mid}` })));
        }
        setLoaded(true);
      })
      .catch((e: Error) => setErr(e?.message ?? "load failed"));
  }, [id]);

  function addMake() {
    if (!picker.make_id || !picker.make_name) return;
    if (pickedMakes.find((m) => m.id === picker.make_id)) return;
    setPickedMakes([...pickedMakes, { id: picker.make_id, name: picker.make_name }]);
    setPicker(EMPTY_VEHICLE);
  }

  function addModel() {
    if (!picker.model_id || !picker.model_name) return;
    if (pickedModels.find((m) => m.id === picker.model_id)) return;
    setPickedModels([...pickedModels, { id: picker.model_id, name: picker.model_name }]);
    setPicker(EMPTY_VEHICLE);
  }

  function toggleArray(field: keyof FormState, value: string) {
    setForm((f) => {
      const cur = f[field] as string[];
      const next = cur.includes(value)
        ? cur.filter((v) => v !== value)
        : [...cur, value];
      return { ...f, [field]: next };
    });
  }

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const bid_cents = Math.round(parseFloat(form.bid_dollars) * 100);
      if (!Number.isFinite(bid_cents) || bid_cents <= 0) {
        throw new Error("Bid must be a positive dollar amount");
      }
      const payload: Record<string, unknown> = {
        bid_cents,
        active: form.active,
        name: form.name || null,
        year_min: form.year_min ? parseInt(form.year_min, 10) : null,
        year_max: form.year_max ? parseInt(form.year_max, 10) : null,
        makes: form.makes
          ? form.makes.split(",").map((s: string) => s.trim()).filter(Boolean)
          : null,
        conditions: form.conditions,
        title_statuses: form.title_statuses,
        zip_codes: form.zip_codes
          ? form.zip_codes.split(",").map((s: string) => s.trim()).filter(Boolean)
          : null,
        weekly_budget_cents: form.weekly_budget_dollars
          ? Math.round(parseFloat(form.weekly_budget_dollars) * 100)
          : null,
        pickup_paid_by: form.pickup_paid_by,
        priority: form.priority,
        notification_preference: form.notification_preference.length
          ? form.notification_preference
          : null,
        make_ids: pickedMakes.length ? pickedMakes.map((m) => m.id) : null,
        model_ids: pickedModels.length ? pickedModels.map((m) => m.id) : null,
        require_runs: form.require_runs,
        require_starts: form.require_starts,
        min_wheels: form.min_wheels,
        require_engine_state: form.require_engine_state.length ? form.require_engine_state : null,
        require_transmission_state: null,
        require_battery: form.require_battery,
        require_keys: form.require_keys,
        has_catalytic: form.require_catalytic,
        exclude_flood: form.exclude_flood,
        exclude_fire: form.exclude_fire,
        max_damage_zones: form.max_damage_zones ? parseInt(form.max_damage_zones, 10) : null,
      };
      await buyerApi.updateRule(id, payload);
      router.replace("/buyers/bid-rules");
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "save failed");
    } finally {
      setBusy(false);
    }
  }

  async function runBacktest() {
    setBusy(true);
    try {
      const r = await buyerApi.testRule(id);
      setBacktest(r);
    } catch (e: unknown) {
      setErr((e as Error)?.message ?? "backtest failed");
    } finally {
      setBusy(false);
    }
  }

  if (err && !loaded) return <main className="p-12 text-red-600">{err}</main>;
  if (!loaded) return <main className="p-12">Loading…</main>;

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Edit Bid Rule #{id}</h1>
      <div className="bg-white rounded shadow p-6 space-y-4">
        <div>
          <Label>Name (optional)</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Camry runs in DFW"
          />
        </div>
        <div>
          <Label>Bid ($)</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            value={form.bid_dollars}
            onChange={(e) => setForm({ ...form, bid_dollars: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="mb-0">Status</Label>
          <button
            type="button"
            onClick={() => setForm({ ...form, active: !form.active })}
            aria-pressed={form.active}
            className={`px-4 py-1 rounded border text-sm font-semibold ${
              form.active
                ? "bg-emerald-600 text-white border-emerald-700"
                : "bg-slate-200 text-slate-700 border-slate-300"
            }`}
          >
            {form.active ? "Active" : "Paused"}
          </button>
        </div>

        <div>
          <Label>Priority</Label>
          <div className="flex gap-2 mt-1">
            {([
              { value: 0, label: "Off" },
              { value: 1, label: "Low" },
              { value: 5, label: "Med" },
              { value: 10, label: "High" },
            ] as Array<{ value: number; label: string }>).map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setForm({ ...form, priority: p.value })}
                className={`px-3 py-1 rounded border text-sm ${
                  form.priority === p.value
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-white text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Higher priority rules win ties when more than one rule matches an offer.
          </p>
        </div>

        <div>
          <Label>Notification channels</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {(["telegram", "email", "sms"] as const).map((ch) => {
              const checked = form.notification_preference.includes(ch);
              return (
                <button
                  type="button"
                  key={ch}
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => {
                    const next = checked
                      ? form.notification_preference.filter((c) => c !== ch)
                      : [...form.notification_preference, ch];
                    setForm({ ...form, notification_preference: next });
                  }}
                  className={`px-3 py-1 rounded border text-sm flex items-center gap-1 ${
                    checked
                      ? "bg-emerald-600 text-white border-emerald-700"
                      : "bg-white text-slate-700"
                  }`}
                >
                  <span aria-hidden>{checked ? "☑" : "☐"}</span>
                  {ch}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pick where matches for this rule should ping you. Defaults to Telegram.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Year min</Label>
            <Input
              type="number"
              value={form.year_min}
              onChange={(e) => setForm({ ...form, year_min: e.target.value })}
            />
          </div>
          <div>
            <Label>Year max</Label>
            <Input
              type="number"
              value={form.year_max}
              onChange={(e) => setForm({ ...form, year_max: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label>Makes (comma separated, blank = any)</Label>
          <Input
            value={form.makes}
            onChange={(e) => setForm({ ...form, makes: e.target.value })}
            placeholder="Honda, Toyota"
          />
        </div>

        {/* VehiclePicker section */}
        <div className="border rounded p-4 space-y-3 bg-slate-50">
          <Label className="font-semibold">Target specific makes / models</Label>
          <VehiclePicker value={picker} onChange={setPicker} showTrim={false} />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addMake}
              disabled={!picker.make_id}
            >
              + Add make
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addModel}
              disabled={!picker.model_id}
            >
              + Add model
            </Button>
          </div>
          {pickedMakes.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Makes:</p>
              <div className="flex flex-wrap gap-1">
                {pickedMakes.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-sm"
                  >
                    {m.name}
                    <button
                      type="button"
                      onClick={() => setPickedMakes(pickedMakes.filter((x) => x.id !== m.id))}
                      className="text-emerald-600 hover:text-emerald-900 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          {pickedModels.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Models:</p>
              <div className="flex flex-wrap gap-1">
                {pickedModels.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-sm"
                  >
                    {m.name}
                    <button
                      type="button"
                      onClick={() => setPickedModels(pickedModels.filter((x) => x.id !== m.id))}
                      className="text-cyan-600 hover:text-cyan-900 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <Label>Conditions</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {CONDITIONS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggleArray("conditions", c)}
                className={`px-3 py-1 rounded border text-sm ${
                  form.conditions.includes(c)
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-white text-slate-700"
                }`}
              >
                {c.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Title statuses</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {TITLES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => toggleArray("title_statuses", t)}
                className={`px-3 py-1 rounded border text-sm ${
                  form.title_statuses.includes(t)
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-white text-slate-700"
                }`}
              >
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Zip codes (comma separated, blank = any)</Label>
          <Input
            value={form.zip_codes}
            onChange={(e) => setForm({ ...form, zip_codes: e.target.value })}
            placeholder="75201, 75202"
          />
        </div>
        <div>
          <Label>Weekly budget ($, blank = unlimited)</Label>
          <Input
            type="number"
            step="0.01"
            value={form.weekly_budget_dollars}
            onChange={(e) =>
              setForm({ ...form, weekly_budget_dollars: e.target.value })
            }
          />
        </div>
        <div>
          <Label>Who pays pickup</Label>
          <div className="flex gap-2 mt-1">
            {PICKUP_PAYORS.map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setForm({ ...form, pickup_paid_by: p })}
                className={`px-3 py-1 rounded border text-sm ${
                  form.pickup_paid_by === p
                    ? "bg-emerald-600 text-white border-emerald-700"
                    : "bg-white text-slate-700"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Condition filters */}
        <div className="border-t pt-4 space-y-3">
          <h2 className="font-semibold text-slate-800">Condition Filters</h2>

          <YesAny
            label="Require runs"
            value={form.require_runs}
            onChange={(v) => setForm({ ...form, require_runs: v })}
          />
          <YesAny
            label="Require starts"
            value={form.require_starts}
            onChange={(v) => setForm({ ...form, require_starts: v })}
          />

          <div className="flex items-center gap-3">
            <span className="text-sm w-40 text-slate-700">Minimum wheels attached</span>
            <div className="flex gap-1">
              {([null, 2, 4] as (null | 2 | 4)[]).map((v) => (
                <button
                  type="button"
                  key={String(v)}
                  onClick={() => setForm({ ...form, min_wheels: v })}
                  className={`px-3 py-1 rounded border text-sm ${
                    form.min_wheels === v
                      ? "bg-emerald-600 text-white border-emerald-700"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {v === null ? "Any" : `${v}+`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm text-slate-700">Acceptable engine states</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {ENGINE_STATES.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleArray("require_engine_state", s)}
                  className={`px-3 py-1 rounded border text-sm ${
                    form.require_engine_state.includes(s)
                      ? "bg-emerald-600 text-white border-emerald-700"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {s}
                </button>
              ))}
              <span className="text-xs text-slate-400 self-center">(blank = any)</span>
            </div>
          </div>

          <YesAny
            label="Battery present"
            value={form.require_battery}
            onChange={(v) => setForm({ ...form, require_battery: v })}
          />
          <YesAny
            label="Keys present"
            value={form.require_keys}
            onChange={(v) => setForm({ ...form, require_keys: v })}
          />
          <YesAny
            label="Catalytic converter"
            value={form.require_catalytic}
            onChange={(v) => setForm({ ...form, require_catalytic: v })}
          />

          <div className="flex items-center gap-3">
            <span className="text-sm w-40 text-slate-700">Exclude flood damage</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, exclude_flood: !form.exclude_flood })}
              className={`px-3 py-1 rounded border text-sm ${
                form.exclude_flood
                  ? "bg-red-600 text-white border-red-700"
                  : "bg-white text-slate-700"
              }`}
            >
              {form.exclude_flood ? "Excluded" : "Allow"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm w-40 text-slate-700">Exclude fire damage</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, exclude_fire: !form.exclude_fire })}
              className={`px-3 py-1 rounded border text-sm ${
                form.exclude_fire
                  ? "bg-red-600 text-white border-red-700"
                  : "bg-white text-slate-700"
              }`}
            >
              {form.exclude_fire ? "Excluded" : "Allow"}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm w-40 text-slate-700">Max damage zones</span>
            <Input
              type="number"
              min="0"
              className="w-24"
              placeholder="Any"
              value={form.max_damage_zones}
              onChange={(e) => setForm({ ...form, max_damage_zones: e.target.value })}
            />
          </div>
        </div>

        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div className="flex gap-2 pt-2">
          <Button onClick={save} disabled={busy} className="flex-1">
            {busy ? "Saving…" : "Save"}
          </Button>
          <Button variant="outline" onClick={runBacktest} disabled={busy}>
            Backtest
          </Button>
          <Button
            variant="outline"
            onClick={() => router.replace("/buyers/bid-rules")}
          >
            Cancel
          </Button>
        </div>
      </div>

      {backtest && (
        <div className="bg-white rounded shadow p-6">
          <h2 className="text-lg font-semibold mb-2">Backtest</h2>
          <p className="text-slate-700">
            In the last {backtest.window_days} days, this rule would have matched{" "}
            <strong>{backtest.matched_offers}</strong> offers, total spend{" "}
            <strong>${(backtest.total_spend_cents / 100).toFixed(0)}</strong>.
          </p>
        </div>
      )}
    </main>
  );
}
