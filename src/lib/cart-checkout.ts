/**
 * The public cart talks to the backend cart endpoints; the site never holds a
 * Stripe secret. The backend creates the order and the Stripe Checkout session:
 *
 *   POST /api/junkyard-public/cart/checkout
 *     {items:[{listing_id, quantity}], customer_email?, success_url, cancel_url}
 *     -> 200 {url, session_id, order_id} | 409 {error:'unavailable', listing_id} | 503 {error:'checkout_disabled'}
 *   GET  /api/junkyard-public/cart/session/<session_id>
 *     -> {status:'pending'|'paid'|'expired', order_id, order_number?, total_cents}
 */
export const CART_BACKEND = `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai"}/api/junkyard-public/cart`;
export const CHECKOUT_SUCCESS_URL = "https://junkerz.com/cart/success?session_id={CHECKOUT_SESSION_ID}";
export const CHECKOUT_CANCEL_URL = "https://junkerz.com/cart";
export const CHECKOUT_CLOSED_MESSAGE = "Checkout is not open yet. Your cart is saved, and you can call us to buy today.";

export type CheckoutSessionStatus = "pending" | "paid" | "expired";
export type CheckoutSession = {
  status: CheckoutSessionStatus;
  orderId: string | null;
  orderNumber: string | null;
  totalCents: number | null;
};

const statuses: CheckoutSessionStatus[] = ["pending", "paid", "expired"];

export function isCheckoutSessionId(value: unknown): value is string {
  return typeof value === "string" && /^cs_(test|live)_[A-Za-z0-9]{8,200}$/.test(value);
}

/** Only Stripe's hosted checkout may be opened from the cart. */
export function isStripeCheckoutUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com";
  } catch { return false; }
}

export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** Ask the backend what happened to a checkout session. Anything unverifiable is null — never a claimed payment. */
export async function readCheckoutSession(sessionId: unknown, fetchImpl: typeof fetch = fetch): Promise<CheckoutSession | null> {
  if (!isCheckoutSessionId(sessionId)) return null;
  try {
    const response = await fetchImpl(`${CART_BACKEND}/session/${encodeURIComponent(sessionId)}`, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
    const row = data as Record<string, unknown>;
    if (!statuses.includes(row.status as CheckoutSessionStatus)) return null;
    const orderId = typeof row.order_id === "string" || typeof row.order_id === "number" ? String(row.order_id) : null;
    return {
      status: row.status as CheckoutSessionStatus,
      orderId,
      orderNumber: typeof row.order_number === "string" && row.order_number.trim() ? row.order_number.trim() : null,
      totalCents: typeof row.total_cents === "number" && Number.isSafeInteger(row.total_cents) && row.total_cents >= 0 ? row.total_cents : null,
    };
  } catch { return null; }
}
