"use client";
import { useId, useState } from "react";
import { getTrimOptions } from "@/lib/vehicle-trims";

type Props = {
  year: number | null;
  make: string | null;
  model: string | null;
  value: string;
  onChange: (value: string) => void;
  lang?: "en" | "es";
  className?: string;
};

export default function TrimPicker({ year, make, model, value, onChange, lang = "en", className }: Props) {
  const id = useId();
  const options = getTrimOptions(year, make, model);
  const [other, setOther] = useState(false);
  const custom = other || (!!value && !options.includes(value));
  const es = lang === "es";
  const fieldClass = className || "w-full border rounded h-10 px-2";
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">
        {es ? "Versión / motor (opcional)" : "Trim / engine (optional)"}
      </label>
      <select id={id} className={fieldClass} disabled={!year || !make || !model}
        value={custom ? "__other" : value}
        onChange={(e) => {
          const next = e.target.value;
          setOther(next === "__other");
          onChange(next === "__other" ? "" : next);
        }}>
        <option value="">{es ? "No sé / omitir" : "Not sure / skip"}</option>
        {options.map((trim) => <option key={trim} value={trim}>{trim}</option>)}
        <option value="__other">{es ? "Otra versión / motor" : "Other trim / engine"}</option>
      </select>
      {custom && (
        <div className="space-y-1 pt-1">
          <label htmlFor={`${id}-other`} className="text-sm font-medium">
            {es ? "Su versión o motor" : "Your trim or engine"}
          </label>
          <input id={`${id}-other`} className={fieldClass} value={value} maxLength={64}
            onChange={(e) => onChange(e.target.value)} placeholder={es ? "Edición especial / 6.2L V8" : "Special edition / 6.2L V8"} />
        </div>
      )}
      <p className="text-xs text-zinc-500">
        {es ? "Puede omitirlo. Elija Otra si su versión no aparece." : "You can skip this. Choose Other if your version isn't listed."}
      </p>
    </div>
  );
}
