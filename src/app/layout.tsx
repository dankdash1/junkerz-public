import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE } from "@/lib/site";
import SiteExtras from "@/components/SiteExtras";
import { ShopCartProvider } from "@/components/ShopCart";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Cash for Junk Cars in Dallas–Fort Worth | Junkerz",
    template: "%s | Junkerz",
  },
  description:
    "Junkerz buys junk, wrecked and non-running cars across Dallas–Fort Worth. Guaranteed offer in about a minute, free towing, cash at pickup. Call 817-420-9180.",
  applicationName: SITE.name,
  icons: {
    icon: [
      { url: "/junkerz-car-v4.ico", sizes: "32x32 256x256", type: "image/x-icon" },
      { url: "/junkerz-car-32-v4.png", sizes: "32x32", type: "image/png" },
      { url: "/junkerz-car-256-v4.png", sizes: "256x256", type: "image/png" },
    ],
    shortcut: "/junkerz-car-v4.ico",
    apple: [{ url: "/junkerz-car-apple-v4.png", sizes: "180x180" }],
  },
  keywords: [
    "cash for junk cars",
    "junk car removal",
    "sell my junk car",
    "we buy junk cars",
    "junk car buyers Dallas",
    "cash for cars Fort Worth",
    "scrap car removal DFW",
    "sell wrecked car Dallas",
    "non running car buyers Texas",
    "vender carro viejo Dallas",
  ],
  authors: [{ name: SITE.legal }],
  creator: SITE.legal,
  publisher: SITE.legal,
  formatDetection: { telephone: true, address: true, email: true },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    alternateLocale: ["es_US"],
    url: SITE.url,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport = {
  themeColor: "#F90303",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ShopCartProvider>{children}</ShopCartProvider>
        <SiteExtras />
      </body>
    </html>
  );
}
