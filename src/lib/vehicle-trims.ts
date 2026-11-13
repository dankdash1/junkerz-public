type TrimRule = { make: string; model: string; from: number; to: number; trims: string[] };

// Common suggestions, not an exhaustive vehicle catalog. Other versions use free text.
const RULES: TrimRule[] = [
  { make: "dodge", model: "challenger", from: 2015, to: 2023, trims: ["SXT", "R/T", "R/T Scat Pack", "SRT Hellcat"] },
  { make: "dodge", model: "charger", from: 2015, to: 2023, trims: ["SXT", "R/T", "Scat Pack", "SRT Hellcat"] },
  { make: "ford", model: "mustang", from: 2015, to: 2026, trims: ["EcoBoost", "GT"] },
  { make: "ford", model: "mustang", from: 2024, to: 2026, trims: ["Dark Horse"] },
  { make: "chevrolet", model: "camaro", from: 2017, to: 2024, trims: ["LT", "SS", "ZL1"] },
  { make: "chevrolet", model: "camaro", from: 2020, to: 2024, trims: ["LT1"] },
  { make: "ram", model: "1500", from: 2021, to: 2024, trims: ["Tradesman", "Big Horn", "Laramie", "Rebel", "Limited", "TRX"] },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function getTrimOptions(year: number | null, make: string | null, model: string | null): string[] {
  if (!year || !make || !model) return [];
  return RULES.filter((rule) => rule.make === normalize(make) && rule.model === normalize(model)
    && year >= rule.from && year <= rule.to).flatMap((rule) => rule.trims);
}
