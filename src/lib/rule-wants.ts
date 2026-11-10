// "What do you buy?" on the bid-rule form (George, 2026-11-09).
//
// A rule takes Any make (one year range) or Only certain makes: one card per make,
// each with its own years and models (empty models = any model). Cards are stored in
// buyer_bid_rules.vehicle_wants. Vehicle types AND on top: Trucks + Toyota = Toyota
// trucks only. The backend matcher (match_engine.want_matches_offer) reads the same
// shape. Pure functions here so the read-back list and the saved payload are tested.
import type { Lang } from "@/lib/buyer-lang";

export type MakeCard = {
  key: string;
  make: string;          // catalog name, e.g. "TOYOTA"; "" until picked
  make_id: number | null;
  year_min: string;      // "" = any
  year_max: string;
  models: string[];      // [] = any model
};

export type WantsState = {
  mode: "any" | "certain";
  year_min: string;      // the Any make range
  year_max: string;
  cards: MakeCard[];
  // An older rule's model list with no make to hang it on. Kept, shown, removable.
  legacyModels: string[];
};

export type StoredWant = {
  make: string;
  make_id: number | null;
  year_min: number | null;
  year_max: number | null;
  models: string[];
};

export type RuleVehicleFields = {
  year_min?: number | null;
  year_max?: number | null;
  makes?: string[] | null;
  models?: string[] | null;
  make_ids?: number[] | null;
  model_ids?: number[] | null;
  vehicle_wants?: StoredWant[] | null;
  make_names?: Record<string, string> | null;
  model_names?: Record<string, { name: string; make_id: number; make: string }> | null;
};

let keySeq = 0;
export function newCardKey(): string {
  keySeq += 1;
  return `card-${keySeq}`;
}

export function emptyWants(): WantsState {
  return { mode: "any", year_min: "", year_max: "", cards: [], legacyModels: [] };
}

const ystr = (y: number | null | undefined) => (y != null ? String(y) : "");
const fold = (s: string) => s.trim().toLowerCase();

function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of list) {
    const k = fold(v);
    if (v.trim() && !seen.has(k)) {
      seen.add(k);
      out.push(v.trim());
    }
  }
  return out;
}

function narrower(a: string, b: string, pick: (x: number, y: number) => number): string {
  if (!a) return b;
  if (!b) return a;
  return String(pick(Number(a), Number(b)));
}

/**
 * Read a saved rule into the form. An older rule (one year range + a list of makes,
 * typed or picked) becomes one card per make, each with that year range, so it keeps
 * taking the same makes and years (plan step 5). A rule with no makes is Any make.
 */
export function wantsFromRule(r: RuleVehicleFields): WantsState {
  const topMin = ystr(r.year_min);
  const topMax = ystr(r.year_max);
  if (r.vehicle_wants && r.vehicle_wants.length) {
    return {
      mode: "certain",
      year_min: "",
      year_max: "",
      // A top range set by an older client still limits every card; fold it in.
      cards: r.vehicle_wants.map((w) => ({
        key: newCardKey(),
        make: w.make ?? "",
        make_id: w.make_id ?? null,
        year_min: narrower(ystr(w.year_min), topMin, Math.max),
        year_max: narrower(ystr(w.year_max), topMax, Math.min),
        models: uniq(w.models ?? []),
      })),
      legacyModels: [],
    };
  }

  type Pending = { make: string; make_id: number | null; models: string[] };
  const byMake = new Map<string, Pending>();
  const add = (make: string, make_id: number | null) => {
    const k = fold(make);
    if (!k) return;
    const cur = byMake.get(k);
    if (cur) {
      if (cur.make_id == null && make_id != null) cur.make_id = make_id;
    } else {
      byMake.set(k, { make: make.trim(), make_id, models: [] });
    }
  };
  for (const m of r.makes ?? []) add(m, null);
  for (const id of r.make_ids ?? []) {
    add(r.make_names?.[String(id)] ?? `Make #${id}`, id);
  }
  // Old picked models are one model in ONE year (a catalog id); keep the name.
  const idModels = (r.model_ids ?? [])
    .map((id) => r.model_names?.[String(id)])
    .filter((m): m is { name: string; make_id: number; make: string } => !!m);
  for (const m of idModels) add(m.make, m.make_id);

  const textModels = uniq(r.models ?? []);
  if (!byMake.size) {
    return { mode: "any", year_min: topMin, year_max: topMax, cards: [], legacyModels: textModels };
  }
  const cards: MakeCard[] = [];
  for (const p of Array.from(byMake.values())) {
    const own = idModels.filter((m) => fold(m.make) === fold(p.make)).map((m) => m.name);
    // A typed model list applied to every listed make; keep it that way.
    cards.push({
      key: newCardKey(),
      make: p.make,
      make_id: p.make_id,
      year_min: topMin,
      year_max: topMax,
      models: uniq([...textModels, ...own]),
    });
  }
  return { mode: "certain", year_min: "", year_max: "", cards, legacyModels: [] };
}

export function storedWants(cards: MakeCard[]): StoredWant[] {
  return cards.map((c) => ({
    make: c.make.trim(),
    make_id: c.make_id,
    year_min: c.year_min ? parseInt(c.year_min, 10) : null,
    year_max: c.year_max ? parseInt(c.year_max, 10) : null,
    models: uniq(c.models),
  }));
}

/** The vehicle part of the save payload. Old make/model columns are cleared: the
 *  cards say everything now, and a hidden old list must never narrow a rule. */
export function wantsPayload(w: WantsState): Record<string, unknown> {
  const certain = w.mode === "certain";
  return {
    year_min: !certain && w.year_min ? parseInt(w.year_min, 10) : null,
    year_max: !certain && w.year_max ? parseInt(w.year_max, 10) : null,
    makes: null,
    make_ids: null,
    model_ids: null,
    models: !certain && w.legacyModels.length ? w.legacyModels : null,
    vehicle_wants: certain ? storedWants(w.cards) : null,
  };
}

export type WantsProblem =
  | { kind: "needOneMake" }
  | { kind: "cardNeedsMake" }
  | { kind: "cardYearOrder"; make: string }
  | { kind: "yearOrder" };

export function wantsProblem(w: WantsState): WantsProblem | null {
  if (w.mode === "any") {
    if (w.year_min && w.year_max && Number(w.year_min) > Number(w.year_max)) return { kind: "yearOrder" };
    return null;
  }
  if (!w.cards.length) return { kind: "needOneMake" };
  for (const c of w.cards) {
    if (!c.make.trim()) return { kind: "cardNeedsMake" };
    if (c.year_min && c.year_max && Number(c.year_min) > Number(c.year_max)) {
      return { kind: "cardYearOrder", make: displayMake(c.make) };
    }
  }
  return null;
}

/** "TOYOTA" -> "Toyota", "LAND ROVER" -> "Land Rover"; short names (BMW, GMC, KIA) stay. */
export function displayMake(name: string): string {
  const s = (name || "").trim();
  if (!s || s !== s.toUpperCase() || s.replace(/[^A-Z]/g, "").length <= 3) return s;
  return s
    .toLowerCase()
    .replace(/(^|[\s\-/])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

// ---- the "You will get" list ------------------------------------------------

const TYPE_WORDS: Record<Lang, Record<string, string>> = {
  en: { car: "cars", truck: "trucks", suv: "SUVs", van: "vans" },
  es: { car: "carros", truck: "pickups", suv: "SUVs", van: "vans" },
};
const TYPE_ORDER = ["car", "truck", "suv", "van"];

function joinAnd(items: string[], lang: Lang): string {
  const and = lang === "es" ? "y" : "and";
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} ${and} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

export function yearsText(min: string, max: string, lang: Lang): string {
  if (min && max) return min === max ? min : `${min}–${max}`;
  if (min) return lang === "es" ? `${min} o más nuevo` : `${min} and newer`;
  if (max) return lang === "es" ? `${max} o más viejo` : `${max} and older`;
  return lang === "es" ? "cualquier año" : "any year";
}

function typesText(types: string[], lang: Lang): string {
  const words = TYPE_ORDER.filter((t) => types.includes(t)).map((t) => TYPE_WORDS[lang][t]);
  return joinAnd(words, lang);
}

/**
 * One line per thing the rule takes, in the buyer's language, e.g.
 *   Toyota trucks, any model, 2008–2018
 *   Honda Civic and Accord trucks, 2010–2020
 * `modelTypes` maps a model name (any case) to the type the matcher will give it,
 * so a model outside the picked types gets a warning instead of silently matching nothing.
 */
export function describeWants(
  types: string[],
  w: WantsState,
  lang: Lang,
  modelTypes: Record<string, string> = {},
): { lines: string[]; warnings: string[] } {
  const es = lang === "es";
  const t = typesText(types, lang);
  const lines: string[] = [];
  const warnings: string[] = [];

  if (w.mode === "any") {
    const yrs = yearsText(w.year_min, w.year_max, lang);
    if (!types.length) {
      lines.push(es ? `Cualquier marca, cualquier tipo, ${yrs}` : `Any make, any type, ${yrs}`);
    } else {
      const T = t.charAt(0).toUpperCase() + t.slice(1);
      lines.push(es ? `${T} de cualquier marca, ${yrs}` : `${T} of any make, ${yrs}`);
    }
    if (w.legacyModels.length) {
      lines.push(es ? `Solo los modelos ${joinAnd(w.legacyModels, lang)}`
                    : `Only the models ${joinAnd(w.legacyModels, lang)}`);
    }
    return { lines, warnings };
  }

  for (const c of w.cards) {
    if (!c.make.trim()) continue;
    const make = displayMake(c.make);
    const yrs = yearsText(c.year_min, c.year_max, lang);
    const models = joinAnd(c.models, lang);
    if (c.models.length) {
      if (es) {
        lines.push(types.length ? `${make} ${models} (${t}), ${yrs}` : `${make} ${models}, cualquier tipo, ${yrs}`);
      } else {
        lines.push(types.length ? `${make} ${models} ${t}, ${yrs}` : `${make} ${models}, any type, ${yrs}`);
      }
    } else if (es) {
      lines.push(types.length ? `${t.charAt(0).toUpperCase() + t.slice(1)} ${make}, cualquier modelo, ${yrs}`
                              : `${make}, cualquier modelo, cualquier tipo, ${yrs}`);
    } else {
      lines.push(types.length ? `${make} ${t}, any model, ${yrs}` : `${make}, any model, any type, ${yrs}`);
    }
    if (types.length) {
      for (const m of c.models) {
        const mt = modelTypes[fold(m)];
        if (mt && !types.includes(mt)) {
          warnings.push(es
            ? `${make} ${m} no es de los tipos que eligió (${t}), así que esta regla nunca lo tomará.`
            : `${make} ${m} is not one of the types you picked (${t}), so this rule will never take it.`);
        }
      }
    }
  }
  return { lines, warnings };
}
