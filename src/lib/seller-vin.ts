export function vinError(code?: string): string {
  if (code === "bad_vin") return "Check the VIN: use all 17 characters shown on the vehicle, without I, O, or Q.";
  if (code === "legacy_vin_review_required") return "This VIN needs a manual review. Ask your pickup partner to check the vehicle and ownership documents.";
  if (code === "sale_finalized") return "The sale documents are already finalized. Contact Junkerz if a detail needs correcting.";
  if (code === "expired") return "This link has expired. Contact Junkerz for a new link.";
  return "We could not save or load your details. Check your email link or contact Junkerz.";
}
