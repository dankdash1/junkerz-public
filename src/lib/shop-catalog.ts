export type ShopProduct = {
  key: string; name: string; kind: "car" | "part"; priceCents: number | null;
  image: string | null; detail: string; maxQuantity: number;
  mileage?: number | null; condition?: string | null;
};

const catalogBase = "https://api.dankdash.ai/api/junkyard-public";

export async function getShopCatalog(): Promise<ShopProduct[]> {
  const results = await Promise.all(["cars", "parts-inventory"].map(async (path) => {
    const response = await fetch(`${catalogBase}/${path}?limit=200`, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Catalog unavailable");
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error("Invalid catalog response");
    return data.items as Record<string, unknown>[];
  }));
  return results.flatMap((rows, index) => rows.map((row): ShopProduct => {
    const kind = index === 0 ? "car" : "part";
    const cents = kind === "car" ? row.asking_price_cents : row.price_cents;
    const photos = (kind === "car" ? row.listing_photos : row.photos) as Record<string, unknown> | null;
    const photo = photos?.side_fl || photos?.front;
    return {
      key: `${kind}:${row.id}`, kind,
      mileage: kind === "car" && typeof row.mileage === "number" && Number.isFinite(row.mileage) && row.mileage >= 0 ? row.mileage : null,
      condition: kind === "part" && typeof row.condition === "string" ? row.condition.replace(/_/g, " ") : null,
      name: kind === "car" ? [row.year, row.make, row.model].filter(Boolean).join(" ") : String(row.part_name || "Auto part"),
      priceCents: typeof cents === "number" && Number.isSafeInteger(cents) && cents > 0 ? cents : null,
      image: typeof photo === "string" && photo.startsWith("https://") ? photo : null,
      detail: kind === "car" ? "Vehicle listing" : [row.compatible_makes, row.compatible_models, row.compatible_years].filter(Boolean).join(" · "),
      // The public listing API doesn't publish stock counts. Treat each
      // listing as one unique item rather than promising extra stock.
      maxQuantity: 1,
    };
  }));
}

export function validateCart(input: unknown): { key: string; quantity: number }[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 30) throw new Error("Choose between 1 and 30 items.");
  const seen = new Set<string>();
  return input.map((item) => {
    if (!item || typeof item.key !== "string" || !/^(car|part):[1-9]\d*$/.test(item.key) || seen.has(item.key) || item.quantity !== 1) {
      throw new Error("Each listing can appear once in your cart.");
    }
    seen.add(item.key);
    return { key: item.key, quantity: 1 };
  });
}
