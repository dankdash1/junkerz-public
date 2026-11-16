import RootDocument, { siteMetadata, siteViewport } from "@/components/RootDocument";

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="en">{children}</RootDocument>;
}
