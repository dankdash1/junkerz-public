import Link from "next/link";
import { ClearPaidCart } from "@/components/ShopCart";
import { SiteHeader } from "@/components/PageShell";
import { formatMoney, readCheckoutSession } from "@/lib/cart-checkout";
import { SITE } from "@/lib/site";
export const dynamic = "force-dynamic";
export const metadata = { title: "Checkout result", robots: { index: false, follow: false } };

// The browser is never trusted about payment: the backend is asked what
// happened to this session and the page says exactly that.
export default async function Success({ searchParams }: { searchParams: { session_id?: string } }) {
  const session = await readCheckoutSession(searchParams.session_id);
  const paid = session?.status === "paid";
  const orderLabel = session?.orderNumber || (session?.orderId ? `#${session.orderId}` : null);
  const heading = paid ? "Payment received" : session?.status === "pending" ? "Payment is still processing" : session?.status === "expired" ? "Checkout expired" : "Payment could not be confirmed";
  return <main>{paid && <ClearPaidCart />}<SiteHeader /><section className="mx-auto max-w-xl px-5 py-16">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Junkerz · Cars &amp; parts</p>
    <h1 className="mt-4 text-3xl font-extrabold">{heading}</h1>
    {paid && <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3 rounded-2xl border border-zinc-200 bg-white p-5 text-sm">
      {orderLabel && <div><dt className="text-zinc-500">Order</dt><dd className="mt-0.5 font-bold">{orderLabel}</dd></div>}
      {session?.totalCents !== null && session?.totalCents !== undefined && <div><dt className="text-zinc-500">Paid</dt><dd className="mt-0.5 font-bold">{formatMoney(session.totalCents)}</dd></div>}
    </dl>}
    <p className="mt-5 text-zinc-600">
      {paid
        ? "Thank you. We will email your receipt and the next steps. Parts ship by delivery; for a vehicle we will call to arrange handover."
        : session?.status === "pending"
          ? "The card processor has not confirmed this payment yet. Refresh this page in a moment. Your cart is kept until it is confirmed."
          : session?.status === "expired"
            ? "This checkout closed before payment. No money was taken and your cart is still saved."
            : `We could not find this checkout. If your card was charged, call ${SITE.phone} with the receipt and we will sort it out.`}
    </p>
    <Link href={paid ? "/shop" : "/cart"} className="mt-8 inline-block font-bold text-brand-700">{paid ? "Return to cars & parts →" : "Back to your cart →"}</Link>
  </section></main>;
}
