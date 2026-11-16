import RootDocument, { siteMetadata, siteViewport } from "@/components/RootDocument";

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function SpanishLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="es">{children}</RootDocument>;
}
