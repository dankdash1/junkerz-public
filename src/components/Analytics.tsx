"use client";
import Script from "next/script";

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

export default function Analytics() {
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
