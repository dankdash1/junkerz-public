import type { MetadataRoute } from "next";
import { SITE, CITIES } from "@/lib/site";

const STATIC = [
  { path: "", priority: 1.0 },
  { path: "/quote", priority: 0.95 },
  { path: "/junk-cars", priority: 0.8 },
  { path: "/not-running", priority: 0.8 },
  { path: "/unwanted-cars", priority: 0.8 },
  { path: "/carro-viejos", priority: 0.8 },
  { path: "/about-us", priority: 0.6 },
  { path: "/contact-us", priority: 0.6 },
  { path: "/privacy-policy", priority: 0.2 },
  { path: "/terms", priority: 0.2 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...STATIC.map((s) => ({
      url: `${SITE.url}${s.path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: s.priority,
    })),
    ...CITIES.map((c) => ({
      url: `${SITE.url}/cash-for-junk-cars/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
