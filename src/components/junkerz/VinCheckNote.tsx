import { vinWarningLines } from "@/lib/pickup-vin";

/** Amber VIN check-digit / model-year note. A warning only: saving stays allowed. */
export default function VinCheckNote({ vin, year, lang = "en" }: {
  vin: string;
  year?: number | string | null;
  lang?: "en" | "es";
}) {
  const lines = vinWarningLines(vin, year, lang);
  if (!lines.length) return null;
  return <div role="status" data-testid="vin-check-note" className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">
    {lines.map(line => <p key={line}>{line}</p>)}
  </div>;
}
