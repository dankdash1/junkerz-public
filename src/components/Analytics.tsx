"use client";
import Script from "next/script";
import { useEffect } from "react";
import { getAttribution } from "@/lib/attribution";

/**
 * The tracking that came across from the WordPress site.
 *
 * Both ids were read off the live GoDaddy server and confirmed against an
 * archived April copy, so they are the same ones that were counting before
 * the domain moved. Without them junkerz.com had zero measurement, which
 * meant every Google Ads click landed on a page that could not report back.
 *
 * Tag Manager is loaded as well as Analytics because the container may hold
 * conversion and call tags set up outside this codebase; dropping it would
 * silently lose them.
 */
export const GA_ID = "G-BXMCTZMR2P";
export const GTM_ID = "GTM-5XGL789";
// Existing actions verified in Junkerz Ads account 377-413-2333.
export const ADS_ID = "AW-583352549";
const LEAD_LABEL = "POO5CMWl_5AYEOWBlZYC";
const CALL_LABEL = "ygzLCNmyifoCEOWBlZYC";

export default function Analytics() {
  // Capture where they came from on the FIRST page they land on. By the time
  // they finish the quote the referrer is junkerz.com and the ad parameters
  // have gone from the address bar.
  useEffect(() => {
    const a = getAttribution();
    if (a) track("attribution", { lead_source: a.source, lead_medium: a.medium });
  }, []);

  // One listener counts every phone, text and email link on every page,
  // including links added later, so no page can forget to wire it up.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onClick = (e: Event) => {
      const el = e.target as { closest?: (s: string) => Element | null } | null;
      const link = el?.closest?.('a[href^="tel:"],a[href^="sms:"],a[href^="mailto:"]');
      if (link) trackContactTap(link.getAttribute("href") || "", link.getAttribute("data-tap-source"));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <>
      <Script
        id="ga-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
          gtag('config', '${ADS_ID}');
          gtag('config', '${ADS_ID}/${CALL_LABEL}', {
            phone_conversion_number: '817-420-9180'
          });
        `}
      </Script>
      <Script id="gtm" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;
          j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
          f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');
        `}
      </Script>
    </>
  );
}

/** Fire a conversion the same way from anywhere. */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...params });
}

/** Count an accepted quote, never a button click or a failed request. */
export function trackLeadSubmission(offerId: number) {
  if (typeof window === "undefined" || !Number.isSafeInteger(offerId) || offerId <= 0) return;
  const transactionId = `junkerz-offer-${offerId}`;
  try {
    if (window.sessionStorage.getItem(transactionId)) return;
  } catch { /* Storage may be disabled; Google also deduplicates by transaction ID. */ }
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    // gtag consumes argument tuples; a plain GTM custom event does not send an Ads conversion.
    const gtag = function (..._args: unknown[]) { w.dataLayer!.push(arguments); };
    gtag("event", "conversion", {
      send_to: `${ADS_ID}/${LEAD_LABEL}`,
      value: 50,
      currency: "USD",
      transaction_id: transactionId,
    });
    try { window.sessionStorage.setItem(transactionId, "1"); } catch { /* Optional deduplication. */ }
  } catch { /* Measurement must never interrupt delivery of the seller's offer. */ }
}

/** Junkerz staff/buyer/driver pages are not customer contact. */
const NOT_CUSTOMER_PAGES = /^\/(buyers|driver|admin)(\/|$)/;

/**
 * Count a tap on a phone, text or email link in two places:
 *  1. Google Analytics, as a real gtag event (the old plain dataLayer push
 *     was never read by Google Analytics, so taps were lost).
 *  2. Our own database through /api/junkyard-public/tap, so we can count
 *     taps without Google or a paid Vercel plan. No phone number, email or
 *     person is sent: only the kind of link, the page and a source label.
 * The beacon is sent before the phone app opens and never blocks the call.
 */
export function trackContactTap(href: string, source?: string | null) {
  if (typeof window === "undefined") return;
  const kind = href.startsWith("tel:") ? "call" : href.startsWith("sms:") ? "text"
    : href.startsWith("mailto:") ? "email" : null;
  if (!kind) return;
  try {
    const page = window.location?.pathname || "/";
    if (NOT_CUSTOMER_PAGES.test(page)) return;
    const device = window.matchMedia?.("(max-width: 767px)").matches ? "mobile" : "desktop";
    const label = source || "link";
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    const gtag = function (..._args: unknown[]) { w.dataLayer!.push(arguments); };
    gtag("event", `${kind}_tap`, { tap_source: label, page_path: page });
    // Tag Manager listeners keyed on the old event name keep working.
    if (kind === "call") track("call_click", { source: label });
    const body = JSON.stringify({ kind, page, source: label, device });
    const nav = window.navigator as Navigator | undefined;
    if (nav?.sendBeacon?.("/api/junkyard-public/tap", body)) return;
    void fetch("/api/junkyard-public/tap", {
      method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" },
    }).catch(() => {});
  } catch { /* Counting must never stop the call. */ }
}
