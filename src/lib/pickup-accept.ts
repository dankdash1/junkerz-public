/**
 * The seller's accept link (emailed by the backend) is
 * https://junkerz.com/pickup/<offer_id>?otp=<token>. The backend refuses an
 * accept without that token (401 otp_required), so the page must find it
 * before it offers the confirm button. The token may also arrive in the URL
 * fragment (#otp=...) when a mail client or redirect moves it there.
 */
export const OPEN_EMAIL_LINK_MESSAGE = "Open the link from your email to accept this offer. The button in that email carries your one-time code.";
export const OTP_REJECTED_MESSAGE = "This accept link has expired or was already used. Open the newest email from Junkerz and try again.";

const OTP_PATTERN = /^[A-Za-z0-9_-]{4,200}$/;

function fromParams(params: URLSearchParams | null | undefined): string | null {
  const value = params?.get("otp")?.trim() || "";
  return OTP_PATTERN.test(value) ? value : null;
}

/** The one-time accept code from the query string, else from a "#otp=" fragment, else null. */
export function readAcceptOtp(search: URLSearchParams | string | null | undefined, hash?: string | null): string | null {
  const query = typeof search === "string" ? new URLSearchParams(search) : search;
  const fromQuery = fromParams(query);
  if (fromQuery) return fromQuery;
  const fragment = (hash || "").replace(/^#/, "");
  return fragment ? fromParams(new URLSearchParams(fragment)) : null;
}
