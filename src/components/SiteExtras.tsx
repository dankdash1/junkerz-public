"use client";
import { usePathname } from "next/navigation";
import Analytics from "@/components/Analytics";
import ChatBubble from "@/components/ChatBubble";

export default function SiteExtras() {
  const path = usePathname();
  // Pickup capabilities and authenticated operations never mount third-party tags.
  if (path === "/pickup" || path.startsWith("/pickup/") || path.startsWith("/buyers/") || path === "/yard-request" || path === "/yard-reply") return null;
  return <><Analytics/><ChatBubble/></>;
}
