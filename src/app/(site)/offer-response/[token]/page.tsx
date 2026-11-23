import type { Metadata } from "next";
import OfferResponseForm from "./OfferResponseForm";

export const metadata: Metadata = { title: "Your Junkerz offer" };

export default function OfferResponsePage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { lang?: string };
}) {
  return <OfferResponseForm token={params.token} es={searchParams.lang === "es"} />;
}
