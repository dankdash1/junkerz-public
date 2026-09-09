/**
 * Where did this seller actually come from?
 *
 * Captured on the visitor's FIRST page and kept for the session, because by
 * the time they finish the quote the referrer is junkerz.com itself and the
 * ad parameters are long gone from the address bar.
 *
 * Recognises the click ids each network stamps on its own traffic, which are
 * far more reliable than the referrer: Google (gclid), Microsoft Bing
 * (msclkid), Meta for Facebook and Instagram (fbclid), TikTok (ttclid).
 */
export type Attribution = {
  source: string;          // google | bing | facebook | instagram | direct | …
  medium: string;          // cpc | organic | social | referral | none
  campaign?: string;
  term?: string;
  content?: string;
  click_id?: string;
  referrer?: string;
  landing_page?: string;
  first_seen?: string;
};

const KEY = "junkerz_attribution";

const HOSTS: [RegExp, string, string][] = [
  [/(^|\.)google\./i, "google", "organic"],
  [/(^|\.)bing\.com/i, "bing", "organic"],
  [/(^|\.)duckduckgo\.com/i, "duckduckgo", "organic"],
  [/(^|\.)yahoo\./i, "yahoo", "organic"],
  [/(^|\.)facebook\.com|(^|\.)fb\./i, "facebook", "social"],
  [/(^|\.)instagram\.com/i, "instagram", "social"],
  [/(^|\.)tiktok\.com/i, "tiktok", "social"],
  [/(^|\.)youtube\.com/i, "youtube", "social"],
  [/(^|\.)x\.com|(^|\.)twitter\.com/i, "x", "social"],
  [/(^|\.)reddit\.com/i, "reddit", "social"],
  [/(^|\.)nextdoor\.com/i, "nextdoor", "social"],
  [/(^|\.)craigslist\./i, "craigslist", "referral"],
  [/(^|\.)yelp\.com/i, "yelp", "referral"],
];

const CLICK_IDS: [string, string, string][] = [
  ["gclid", "google", "cpc"],
  ["gbraid", "google", "cpc"],
  ["wbraid", "google", "cpc"],
  ["msclkid", "bing", "cpc"],
  ["fbclid", "facebook", "social"],
  ["ttclid", "tiktok", "social"],
];

function detect(): Attribution {
  const q = new URLSearchParams(window.location.search);
  const ref = document.referrer || "";

  const a: Attribution = {
    source: "direct",
    medium: "none",
    referrer: ref || undefined,
    landing_page: window.location.pathname || "/",
    first_seen: new Date().toISOString(),
  };

  // 1. An explicit utm_source always wins — it is what the marketer intended.
  const utmSource = q.get("utm_source");
  if (utmSource) {
    a.source = utmSource.toLowerCase();
    a.medium = (q.get("utm_medium") || "referral").toLowerCase();
  } else {
    // 2. A click id is the network telling us itself. Trust it over referrer.
    for (const [param, src, med] of CLICK_IDS) {
      const v = q.get(param);
      if (v) { a.source = src; a.medium = med; a.click_id = v; break; }
    }
    // 3. Fall back to who sent them.
    if (a.source === "direct" && ref) {
      try {
        const host = new URL(ref).hostname;
        if (!/junkerz\.com$|junkerz\.dankdash\.ai$/i.test(host)) {
          const hit = HOSTS.find(([re]) => re.test(host));
          if (hit) { a.source = hit[1]; a.medium = hit[2]; }
          else { a.source = host.replace(/^www\./, ""); a.medium = "referral"; }
        }
      } catch { /* malformed referrer — leave as direct */ }
    }
  }

  const campaign = q.get("utm_campaign");
  const term = q.get("utm_term");
  const content = q.get("utm_content");
  if (campaign) a.campaign = campaign;
  if (term) a.term = term;
  if (content) a.content = content;
  if (!a.click_id) {
    for (const [param] of CLICK_IDS) {
      const v = q.get(param);
      if (v) { a.click_id = v; break; }
    }
  }
  return a;
}

/** Read the stored attribution, capturing it on the first page if needed. */
export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Attribution;
      // A later ad click on the same visit should win — it is more recent
      // intent and it is what the spend should be credited to.
      const fresh = detect();
      if (fresh.source !== "direct" && fresh.source !== parsed.source) {
        sessionStorage.setItem(KEY, JSON.stringify(fresh));
        return fresh;
      }
      return parsed;
    }
    const a = detect();
    sessionStorage.setItem(KEY, JSON.stringify(a));
    return a;
  } catch {
    // Private browsing can throw on sessionStorage. Never break the quote.
    try { return detect(); } catch { return null; }
  }
}
