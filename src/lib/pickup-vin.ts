/** Buyer / driver types the VIN at pickup (George 2026-11-23: "don't block anything"). */
export function normalizeVin(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function vinLooksValid(value: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizeVin(value));
}

export const VIN_SHAPE_MESSAGE = "A VIN is 17 letters and numbers, no I, O or Q.";

export function pickupVinError(code?: string): string {
  if (code === "bad_vin") return VIN_SHAPE_MESSAGE;
  if (code === "legacy_vin_review_required") return "Cars older than 1981 have a shorter serial number. Call Junkerz and we will add it.";
  if (code === "bill_of_sale_already_signed") return "The bill of sale is already signed, so the VIN can't be changed. Call Junkerz if it is wrong.";
  if (code === "pickup_not_open") return "This pickup is closed, so the VIN can't be changed.";
  if (code === "driver_name_required") return "Type your name first (step 01).";
  if (code && /expired|unavailable/i.test(code)) return code;
  return "Could not save the VIN. Try again.";
}

/*
 * VIN check digit + model year (George 2026-11-23: a WARNING, never a block).
 * Same math as the backend src/services/junkerz/vin_check.py: ISO 3779 /
 * 49 CFR 565 weights, sum mod 11, 10 -> "X", compared with position 9; model
 * year from position 10, the 30-year cycle nearest the stated year.
 */
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const VIN_TRANSLIT: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};
const VIN_YEAR_CODES = "ABCDEFGHJKLMNPRSTVWXY123456789";

export type VinCheck = {
  checkDigitOk: boolean;
  yearMatches: boolean | null;
  decodedYear: number | null;
  warnings: ("check_digit" | "year_mismatch")[];
};

function statedYear(year?: number | string | null): number | null {
  if (year === null || year === undefined || String(year).trim() === "") return null;
  const n = Number(year);
  return Number.isInteger(n) ? n : null;
}

export function vinCheckDigit(value: string): string | null {
  const vin = normalizeVin(value);
  if (!vinLooksValid(vin)) return null;
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i];
    const n = /[0-9]/.test(c) ? Number(c) : VIN_TRANSLIT[c];
    sum += n * VIN_WEIGHTS[i];
  }
  const rem = sum % 11;
  return rem === 10 ? "X" : String(rem);
}

export function decodeVinYear(value: string, year?: number | string | null): number | null {
  const vin = normalizeVin(value);
  if (vin.length !== 17) return null;
  const idx = VIN_YEAR_CODES.indexOf(vin[9]);
  if (idx < 0) return null;
  const base = 1980 + idx;
  const stated = statedYear(year);
  if (stated === null) {
    const later = base + 30;
    return later <= new Date().getFullYear() + 1 ? later : base;
  }
  const da = Math.abs(base - stated), db = Math.abs(base + 30 - stated);
  return db <= da ? base + 30 : base;
}

export function checkVin(value: string, year?: number | string | null): VinCheck {
  const vin = normalizeVin(value || "");
  const expected = vinCheckDigit(vin);
  const checkDigitOk = expected !== null && vin[8] === expected;
  const stated = statedYear(year);
  const decodedYear = expected !== null ? decodeVinYear(vin, stated) : null;
  const yearMatches = stated === null || decodedYear === null ? null : decodedYear === stated;
  const warnings: VinCheck["warnings"] = [];
  if (!checkDigitOk) warnings.push("check_digit");
  if (yearMatches === false) warnings.push("year_mismatch");
  return { checkDigitOk, yearMatches, decodedYear, warnings };
}

/**
 * Amber-note lines for a typed VIN, or [] when it passes or is not yet 17
 * letters and numbers (the shape message covers that). Never blocks saving.
 */
export function vinWarningLines(value: string, year?: number | string | null, lang: "en" | "es" = "en"): string[] {
  if (!vinLooksValid(value)) return [];
  const result = checkVin(value, year);
  if (!result.warnings.length) return [];
  const es = lang === "es";
  const lines = [es
    ? "Este VIN no parece correcto. Compárelo con la placa del VIN o con el título."
    : "This VIN doesn't look right — please double-check it against the VIN plate or the title."];
  if (result.yearMatches === false && result.decodedYear !== null) {
    lines.push(es
      ? `Este VIN parece de ${result.decodedYear}, pero el carro está registrado como ${statedYear(year)}.`
      : `This VIN looks like a ${result.decodedYear}, but the car is listed as ${statedYear(year)}.`);
  }
  return lines;
}
