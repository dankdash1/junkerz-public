import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ChatBubble from "@/components/ChatBubble";

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
  title: "Junkerz — Get Cash for Your Junk Car",
  description: "Instant quote, free pickup, paid on the spot. Junkerz LLC.",
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
        {children}
        <ChatBubble />
      </body>
    </html>
  );
}
