import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Search engines and AI assistants are both welcome.
 * Keep the same private-path exclusions for every crawler. A more specific
 * user-agent group replaces the wildcard rules; it does not inherit them.
 */
const AI_AGENTS = [
  "GPTBot",            // Training permission, separate from search
  "OAI-SearchBot",     // ChatGPT search index
  "ChatGPT-User",      // ChatGPT live fetch on a user's behalf
  "ClaudeBot",         // Anthropic Claude
  "Claude-SearchBot",
  "Claude-User",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",   // Some Gemini uses; Googlebot controls Google Search
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "Applebot",
  "Bingbot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: ["*", ...AI_AGENTS], allow: "/", disallow: ["/api/", "/buyers/", "/pickup/", "/status/", "/schedule/", "/sign/", "/vin/", "/decline/", "/quote/result"] },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
