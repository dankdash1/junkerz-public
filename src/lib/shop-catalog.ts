export type CatalogMode = "off" | "coming_soon" | "live";
export type CatalogSection = "parts" | "cars_for_parts" | "cars_for_sale";
export type ShopProductKind = "part" | "parts-car" | "car";
export type ShopCategory = "all" | ShopProductKind;

export type CatalogSettings = {
  sections: Record<CatalogSection, CatalogMode>;
  parts_fulfillment: "delivery_only";
  checkout_enabled: false;
};

export type ShopProduct = {
  key: string;
  id: number;
  carId: number | null;
  href: string | null;
  name: string;
  kind: ShopProductKind;
  section: CatalogSection;
  priceCents: number | null;
  image: string | null;
  detail: string;
  maxQuantity: number;
  mileage?: number | null;
  condition?: string | null;
};

export const CLOSED_CATALOG_SETTINGS: CatalogSettings = {
  sections: {
    parts: "coming_soon",
    cars_for_parts: "coming_soon",
    cars_for_sale: "coming_soon",
  },
  parts_fulfillment: "delivery_only",
  checkout_enabled: false,
};

const catalogBase = `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai"}/api/junkyard-public`;
const sectionKeys: CatalogSection[] = ["parts", "cars_for_parts", "cars_for_sale"];
const modes: CatalogMode[] = ["off", "coming_soon", "live"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  return actual.length === required.length && actual.every((key, index) => key === required[index]);
}

export function parseCatalogSettings(input: unknown): CatalogSettings {
  if (!isRecord(input) || !hasExactKeys(input, ["sections", "parts_fulfillment", "checkout_enabled"]) ||
      input.parts_fulfillment !== "delivery_only" || input.checkout_enabled !== false || !isRecord(input.sections) ||
      !hasExactKeys(input.sections, sectionKeys)) {
    throw new Error("Invalid catalog settings response");
  }
  const sections = input.sections;
  if (!sectionKeys.every((key) => modes.includes(sections[key] as CatalogMode))) {
    throw new Error("Invalid catalog settings response");
  }
  return {
    sections: {
      parts: sections.parts as CatalogMode,
      cars_for_parts: sections.cars_for_parts as CatalogMode,
      cars_for_sale: sections.cars_for_sale as CatalogMode,
    },
    parts_fulfillment: "delivery_only",
    checkout_enabled: false,
  };
}

export async function getCatalogSettings(fetchImpl: typeof fetch = fetch): Promise<CatalogSettings> {
  const response = await fetchImpl(`${catalogBase}/catalog-settings`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Catalog settings unavailable");
  return parseCatalogSettings(await response.json());
}

export function sectionForProductKind(kind: ShopProductKind): CatalogSection {
  if (kind === "part") return "parts";
  if (kind === "parts-car") return "cars_for_parts";
  return "cars_for_sale";
}

export function sectionForProductKey(key: string): CatalogSection | null {
  if (/^part:[1-9]\d*$/.test(key)) return "parts";
  if (/^parts-car:[1-9]\d*$/.test(key)) return "cars_for_parts";
  if (/^car:[1-9]\d*$/.test(key)) return "cars_for_sale";
  return null;
}

export function categoryMode(settings: CatalogSettings, category: ShopCategory): CatalogMode {
  if (category === "all") {
    const values = sectionKeys.map((key) => settings.sections[key]);
    if (values.some((mode) => mode === "live")) return "live";
    if (values.some((mode) => mode === "coming_soon")) return "coming_soon";
    return "off";
  }
  return settings.sections[sectionForProductKind(category)];
}

export function visibleShopCategories(settings: CatalogSettings): ShopCategory[] {
  const categories: ShopProductKind[] = ["car", "parts-car", "part"];
  const visible = categories.filter((category) => categoryMode(settings, category) !== "off");
  return visible.length > 1 ? ["all", ...visible] : visible;
}

type CatalogSource = { section: CatalogSection; path: string; kind: ShopProductKind };
const sources: CatalogSource[] = [
  { section: "cars_for_sale", path: "cars", kind: "car" },
  { section: "cars_for_parts", path: "parts", kind: "parts-car" },
  { section: "parts", path: "parts-inventory", kind: "part" },
];

export async function getShopCatalog(settings: CatalogSettings, fetchImpl: typeof fetch = fetch): Promise<ShopProduct[]> {
  const liveSources = sources.filter(({ section }) => settings.sections[section] === "live");
  const results = await Promise.all(liveSources.map(async (source) => {
    const response = await fetchImpl(`${catalogBase}/${source.path}?limit=200`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Catalog unavailable");
    const data: unknown = await response.json();
    if (!isRecord(data) || !Array.isArray(data.items) || (data.state !== undefined && data.state !== "live")) {
      throw new Error("Invalid catalog response");
    }
    return { source, rows: data.items as Record<string, unknown>[] };
  }));

  return results.flatMap(({ source, rows }) => rows.map((row): ShopProduct => {
    const isIndividualPart = source.kind === "part";
    const cents = isIndividualPart ? row.price_cents : row.asking_price_cents;
    const photos = (isIndividualPart ? row.photos : row.listing_photos) as Record<string, unknown> | null;
    const photo = photos?.side_fl || photos?.front;
    return {
      key: `${source.kind}:${row.id}`,
      id: Number(row.id),
      carId: Number(isIndividualPart ? row.car_id : row.id) || null,
      href: isIndividualPart
        ? `/parts-inventory/${row.id}`
        : typeof row.vin === "string" && row.vin.trim() ? `/${source.kind === "car" ? "cars" : "parts"}/${encodeURIComponent(row.vin.trim())}` : null,
      kind: source.kind,
      section: source.section,
      mileage: !isIndividualPart && typeof row.mileage === "number" && Number.isFinite(row.mileage) && row.mileage >= 0 ? row.mileage : null,
      condition: isIndividualPart && typeof row.condition === "string" ? row.condition.replace(/_/g, " ") : null,
      name: isIndividualPart ? String(row.part_name || "Auto part") : [row.year, row.make, row.model].filter(Boolean).join(" ") || "Vehicle",
      priceCents: typeof cents === "number" && Number.isSafeInteger(cents) && cents > 0 ? cents : null,
      image: typeof photo === "string" && photo.startsWith("https://") ? photo : null,
      detail: isIndividualPart
        ? [row.compatible_makes, row.compatible_models, row.compatible_years].filter(Boolean).join(" · ")
        : source.kind === "car" ? "Vehicle listing" : "Vehicle available for parts",
      maxQuantity: 1,
    };
  }));
}

export async function loadShopPageCatalog(
  settings: CatalogSettings,
  category: ShopCategory,
  fetchImpl: typeof fetch = fetch,
): Promise<{ notFound: boolean; products: ShopProduct[] }> {
  if (categoryMode(settings, category) === "off") return { notFound: true, products: [] };
  return { notFound: false, products: await getShopCatalog(settings, fetchImpl) };
}

export async function getCatalogDetail(
  settings: CatalogSettings,
  kind: ShopProductKind,
  identifier: string,
  fetchImpl: typeof fetch = fetch,
): Promise<ShopProduct | null> {
  if (settings.sections[sectionForProductKind(kind)] !== "live") return null;
  const source = kind === "car" ? "cars" : kind === "parts-car" ? "parts" : "parts-inventory";
  const response = await fetchImpl(`${catalogBase}/${source}/${encodeURIComponent(identifier)}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Catalog detail unavailable");
  const row: unknown = await response.json();
  if (!isRecord(row) || !Number.isInteger(Number(row.id)) || Number(row.id) <= 0) throw new Error("Invalid catalog detail response");
  const isPart = kind === "part";
  const photos = (isPart ? row.photos : row.listing_photos) as Record<string, unknown> | null;
  const photo = photos?.side_fl || photos?.front;
  const cents = isPart ? row.price_cents : row.asking_price_cents;
  const vin = String(row.vin || "");
  return {
    key: `${kind}:${row.id}`,
    id: Number(row.id),
    carId: Number(isPart ? row.car_id : row.id) || null,
    href: isPart ? `/parts-inventory/${row.id}` : vin.trim() ? `/${kind === "car" ? "cars" : "parts"}/${encodeURIComponent(vin.trim())}` : null,
    kind,
    section: sectionForProductKind(kind),
    mileage: !isPart && typeof row.mileage === "number" && row.mileage >= 0 ? row.mileage : null,
    condition: isPart && typeof row.condition === "string" ? row.condition.replace(/_/g, " ") : null,
    name: isPart ? String(row.part_name || "Auto part") : [row.year, row.make, row.model].filter(Boolean).join(" ") || "Vehicle",
    priceCents: typeof cents === "number" && Number.isSafeInteger(cents) && cents > 0 ? cents : null,
    image: typeof photo === "string" && photo.startsWith("https://") ? photo : null,
    detail: isPart ? [row.compatible_makes, row.compatible_models, row.compatible_years].filter(Boolean).join(" · ") : kind === "car" ? "Vehicle listing" : "Vehicle available for parts",
    maxQuantity: 1,
  };
}

export function validateCart(input: unknown): { key: string; quantity: number }[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > 30) throw new Error("Choose between 1 and 30 items.");
  const seen = new Set<string>();
  return input.map((item) => {
    if (!item || typeof item.key !== "string" || !/^(car|parts-car|part):[1-9]\d*$/.test(item.key) || seen.has(item.key) || item.quantity !== 1) {
      throw new Error("Each listing can appear once in your cart.");
    }
    seen.add(item.key);
    return { key: item.key, quantity: 1 };
  });
}
