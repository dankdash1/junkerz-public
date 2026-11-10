"use client";
// "What do you buy?" (George's approved layout, 2026-11-09).
//   (•) Any make      Years [Any] to [Any]
//   ( ) Only certain makes  -> one card per make: Make, its own Years, its own Models
//   You will get: a plain list of what the rule takes, in the buyer's language.
// Every choice is a dropdown. Picking from a dropdown adds the item; there are no
// "+ Add make / + Add model" buttons. Vehicle types (chosen above) narrow the makes
// and models offered here, and the matcher ANDs them: Trucks + Toyota = Toyota trucks.
import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "@/lib/api-base";
import type { Lang } from "@/lib/buyer-lang";
import { ruleText } from "@/components/buyers/ruleText";
import { YearSelect } from "@/components/buyers/RuleFields";
import {
  describeWants,
  displayMake,
  newCardKey,
  type MakeCard,
  type WantsState,
} from "@/lib/rule-wants";

type Make = { id: number; name: string };
type ModelName = { name: string; category: string };

const fold = (s: string) => s.trim().toLowerCase();

function MakeCardBox({
  card,
  makes,
  types,
  lang,
  onChange,
  onRemove,
  onModelTypes,
}: {
  card: MakeCard;
  makes: Make[];
  types: string[];
  lang: Lang;
  onChange: (c: MakeCard) => void;
  onRemove: () => void;
  onModelTypes: (types: Record<string, string>) => void;
}) {
  const t = ruleText(lang);
  const [models, setModels] = useState<ModelName[]>([]);
  const reportTypes = useRef(onModelTypes);
  reportTypes.current = onModelTypes;

  const typeKey = types.join(",");
  useEffect(() => {
    if (!card.make_id) {
      setModels([]);
      return;
    }
    const q = new URLSearchParams({ make_id: String(card.make_id) });
    if (card.year_min) q.set("year_min", card.year_min);
    if (card.year_max) q.set("year_max", card.year_max);
    let live = true;
    // Every model of the make, with its type; the dropdown shows only the picked
    // types, and a chosen model outside them gets a warning in "You will get".
    fetch(`${API_BASE}/api/junkerz/vehicles/models/by-make?${q}`)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        const list: ModelName[] = Array.isArray(j?.models) ? j.models : [];
        setModels(list);
        const map: Record<string, string> = {};
        for (const m of list) map[fold(m.name)] = m.category;
        reportTypes.current(map);
      })
      .catch(() => live && setModels([]));
    return () => {
      live = false;
    };
  }, [card.make_id, card.year_min, card.year_max]);

  const offered = useMemo(() => {
    const chosen = new Set(card.models.map(fold));
    return models.filter(
      (m) => !chosen.has(fold(m.name)) && (!types.length || types.includes(m.category)),
    );
    // typeKey stands in for `types` so a new array with the same values does not refilter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [models, card.models, typeKey]);

  // A saved make missing from the list (another type picked, or an old typed name)
  // still shows, so it is never silently dropped on Save.
  const makeOptions =
    card.make && !makes.some((m) => (card.make_id ? m.id === card.make_id : fold(m.name) === fold(card.make)))
      ? [{ id: card.make_id ?? -1, name: card.make }, ...makes]
      : makes;
  const selected = card.make
    ? String(card.make_id ?? makeOptions.find((m) => fold(m.name) === fold(card.make))?.id ?? -1)
    : "";
  const shown = displayMake(card.make) || t.make;

  return (
    <div className="p-3 space-y-2 bg-white" data-testid="make-card">
      <div className="flex items-center gap-2">
        <label className="text-sm text-slate-700 w-16 shrink-0" htmlFor={`${card.key}-make`}>
          {t.make}
        </label>
        <select
          id={`${card.key}-make`}
          className="flex-1 border rounded h-10 px-2 bg-white"
          value={selected}
          onChange={(e) => {
            const id = parseInt(e.target.value, 10);
            const m = makeOptions.find((x) => x.id === id);
            if (!m) return;
            // A new make starts with any model: the old one's models do not fit it.
            onChange({ ...card, make: m.name, make_id: m.id > 0 ? m.id : null, models: [] });
          }}
        >
          <option value="" disabled>
            {makes.length || card.make ? t.pickMake : t.makesLoading}
          </option>
          {makeOptions.map((m) => (
            <option key={`${m.id}-${m.name}`} value={m.id}>
              {displayMake(m.name)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t.removeMake(shown)}
          title={t.removeMake(shown)}
          className="h-10 w-10 shrink-0 rounded border text-slate-600 hover:bg-slate-100"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-700 w-16 shrink-0">{t.years}</span>
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <YearSelect
            label={`${shown}: ${t.yearFrom}`}
            hideLabel
            lang={lang}
            value={card.year_min}
            onChange={(v) => onChange({ ...card, year_min: v })}
          />
          <span className="text-sm text-slate-600">{t.to}</span>
          <YearSelect
            label={`${shown}: ${t.yearTo}`}
            hideLabel
            lang={lang}
            value={card.year_max}
            onChange={(v) => onChange({ ...card, year_max: v })}
          />
        </div>
      </div>
      <div className="flex items-start gap-2">
        <span className="text-sm text-slate-700 w-16 shrink-0 pt-2">{t.models}</span>
        <div className="flex-1 space-y-2">
          {card.models.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {card.models.map((m) => (
                <span
                  key={m}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-sm"
                >
                  {m}
                  <button
                    type="button"
                    aria-label={t.removeModel(m)}
                    onClick={() => onChange({ ...card, models: card.models.filter((x) => x !== m) })}
                    className="text-cyan-600 hover:text-cyan-900 font-bold"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <select
            aria-label={`${shown}: ${t.models}`}
            className="w-full border rounded h-10 px-2 bg-white"
            value=""
            disabled={!card.make}
            onChange={(e) => {
              const name = e.target.value;
              if (name && !card.models.some((x) => fold(x) === fold(name))) {
                onChange({ ...card, models: [...card.models, name] });
              }
            }}
          >
            <option value="">{card.models.length ? t.addModel : t.anyModel}</option>
            {offered.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function VehicleWantsField({
  value,
  onChange,
  types,
  lang,
}: {
  value: WantsState;
  onChange: (v: WantsState) => void;
  types: string[];
  lang: Lang;
}) {
  const t = ruleText(lang);
  const [makes, setMakes] = useState<Make[]>([]);
  const [modelTypes, setModelTypes] = useState<Record<string, string>>({});
  const latest = useRef(value);
  latest.current = value;

  const typeKey = types.join(",");
  useEffect(() => {
    const q = new URLSearchParams();
    if (typeKey) q.set("categories", typeKey);
    let live = true;
    fetch(`${API_BASE}/api/junkerz/vehicles/makes/by-category${q.toString() ? `?${q}` : ""}`)
      .then((r) => r.json())
      .then((j) => live && setMakes(Array.isArray(j?.makes) ? j.makes : []))
      .catch(() => live && setMakes([]));
    return () => {
      live = false;
    };
  }, [typeKey]);

  // An older rule's typed make ("Honda") gets its catalog id once the list loads,
  // so its models can be listed. Same make either way: the matcher compares names
  // ignoring case and also accepts the id.
  useEffect(() => {
    if (!makes.length) return;
    const cur = latest.current;
    let changed = false;
    const cards = cur.cards.map((c) => {
      if (c.make_id || !c.make) return c;
      const hit = makes.find((m) => fold(m.name) === fold(c.make));
      if (!hit) return c;
      changed = true;
      return { ...c, make: hit.name, make_id: hit.id };
    });
    if (changed) onChange({ ...cur, cards });
    // onChange is a fresh closure every render; the list is what matters here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makes]);

  const setCard = (key: string, next: MakeCard) =>
    onChange({ ...value, cards: value.cards.map((c) => (c.key === key ? next : c)) });

  const addCard = () => {
    // A new card starts with the years of the card above it (most yards use one range).
    const above = value.cards[value.cards.length - 1];
    onChange({
      ...value,
      cards: [
        ...value.cards,
        {
          key: newCardKey(),
          make: "",
          make_id: null,
          year_min: above ? above.year_min : value.year_min,
          year_max: above ? above.year_max : value.year_max,
          models: [],
        },
      ],
    });
  };

  const choose = (mode: "any" | "certain") => {
    if (mode === value.mode) return;
    if (mode === "certain" && !value.cards.length) {
      onChange({
        ...value,
        mode,
        cards: [{ key: newCardKey(), make: "", make_id: null,
                  year_min: value.year_min, year_max: value.year_max, models: [] }],
      });
      return;
    }
    onChange({ ...value, mode });
  };

  const { lines, warnings } = describeWants(types, value, lang, modelTypes);

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-slate-800">{t.whatDoYouBuy}</h2>
      <div className="space-y-2" role="radiogroup" aria-label={t.whatDoYouBuy}>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="what-do-you-buy"
              checked={value.mode === "any"}
              onChange={() => choose("any")}
            />
            {t.anyMake}
          </label>
          {value.mode === "any" && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span>{t.years}</span>
              <YearSelect
                label={t.yearFrom}
                hideLabel
                lang={lang}
                value={value.year_min}
                onChange={(v) => onChange({ ...value, year_min: v })}
              />
              <span>{t.to}</span>
              <YearSelect
                label={t.yearTo}
                hideLabel
                lang={lang}
                value={value.year_max}
                onChange={(v) => onChange({ ...value, year_max: v })}
              />
            </div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="radio"
            name="what-do-you-buy"
            checked={value.mode === "certain"}
            onChange={() => choose("certain")}
          />
          {t.certainMakes}
        </label>
      </div>

      {value.mode === "any" && value.legacyModels.length > 0 && (
        <p className="text-xs text-slate-600 bg-white border rounded p-2 flex flex-wrap items-center gap-2">
          <span>{t.legacyModels(value.legacyModels.join(", "))}</span>
          <button
            type="button"
            className="underline"
            onClick={() => onChange({ ...value, legacyModels: [] })}
          >
            {t.removeLegacyModels}
          </button>
        </p>
      )}

      {value.mode === "certain" && (
        <div className="space-y-2">
          {value.cards.length > 0 && (
            <div className="border rounded divide-y overflow-hidden">
              {value.cards.map((c) => (
                <MakeCardBox
                  key={c.key}
                  card={c}
                  makes={makes}
                  types={types}
                  lang={lang}
                  onChange={(next) => setCard(c.key, next)}
                  onRemove={() =>
                    onChange({ ...value, cards: value.cards.filter((x) => x.key !== c.key) })
                  }
                  onModelTypes={(map) => setModelTypes((cur) => ({ ...cur, ...map }))}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={addCard}
            className="px-3 py-1 rounded border text-sm bg-white text-slate-700 hover:bg-slate-50"
          >
            {value.cards.length ? t.addAnotherMake : t.addMake}
          </button>
        </div>
      )}

      <div className="rounded border border-emerald-200 bg-emerald-50 p-3" aria-live="polite">
        <p className="text-sm font-semibold text-slate-800">{t.youWillGet}</p>
        {lines.length ? (
          <ul className="list-disc pl-5 text-sm text-slate-800" data-testid="you-will-get">
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-amber-800">{t.nothingYet}</p>
        )}
        {warnings.map((w) => (
          <p key={w} className="text-sm text-red-700 mt-1">
            {w}
          </p>
        ))}
      </div>
    </div>
  );
}
