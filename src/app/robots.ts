import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Search engines and AI assistants are both welcome.
 * The AI crawlers are listed explicitly because several of them
 * ignore a bare wildcard and look for their own user-agent block.
 */
const AI_AGENTS = [
  "GPTBot",            // OpenAI training + ChatGPT browsing
  "OAI-SearchBot",     // ChatGPT search index
  "ChatGPT-User",      // ChatGPT live fetch on a user's behalf
  "ClaudeBot",         // Anthropic Claude
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",   // Gemini / Google AI answers
  "PerplexityBot",
  "Perplexity-User",
  "Applebot-Extended",
  "Bingbot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/buyers/", "/pickup/", "/status/", "/schedule/", "/sign/", "/vin/"] },
      ...AI_AGENTS.map((ua) => ({ userAgent: ua, allow: "/" })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
