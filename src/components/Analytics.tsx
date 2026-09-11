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
