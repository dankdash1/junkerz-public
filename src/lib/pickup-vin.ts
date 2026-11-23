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
