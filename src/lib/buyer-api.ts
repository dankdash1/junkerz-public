const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.dankdash.ai";

function token(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("buyer_token");
}

async function _fetch(path: string, init: RequestInit = {}) {
  const t = token();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (t) headers["Authorization"] = `Bearer ${t}`;
  const r = await fetch(`${BASE}${path}`, { ...init, headers });
  if (r.status === 401) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("buyer_token");
      // Avoid redirect loops on the login page itself
      if (!window.location.pathname.endsWith("/buyers/login")) {
        window.location.href = "/buyers/login";
      }
    }
  }
  return r;
}

async function _json(r: Response) {
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `HTTP ${r.status}`);
  }
  return r.json();
}

export type BuyerSignupBody = {
  email: string;
  password: string;
  business_name: string;
  // PR-J8 expansion (all optional at the column level; per-field "required"
  // is gated by the org's `buyer_signup_required_fields` JSONB list).
  contact_name?: string;
  address?: string;
  phone?: string;
  website?: string;
  license_number?: string;
  notification_email?: string;
};

export type SignupConfig = {
  required_fields: string[];
  all_fields: string[];
};

export type DocumentType = "w9" | "license" | "insurance" | "id";

export const buyerApi = {
  signup: (b: BuyerSignupBody) =>
    _fetch("/api/buyers/auth/signup", { method: "POST", body: JSON.stringify(b) }).then(_json),
  signupConfig: () =>
    _fetch("/api/buyers/public/signup-config").then(_json) as Promise<SignupConfig>,
  uploadDocument: async (kind: DocumentType, file: File) => {
    const t = token();
    const fd = new FormData();
    fd.append("document_type", kind);
    fd.append("file", file);
    const r = await fetch(`${BASE}/api/buyers/documents/upload`, {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: fd,
    });
    return _json(r);
  },
  listDocuments: () => _fetch("/api/buyers/documents").then(_json),
  login: (email: string, password: string) =>
    _fetch("/api/buyers/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }).then(_json),
  me: () => _fetch("/api/buyers/me").then(_json),
  onboardingStatus: () => _fetch("/api/buyers/onboarding/status").then(_json),
  signTerms: () => _fetch("/api/buyers/onboarding/sign-terms", { method: "POST" }).then(_json),
  uploadW9: async (file: File) => {
    const t = token();
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(`${BASE}/api/buyers/onboarding/w9`, {
      method: "POST",
      headers: t ? { Authorization: `Bearer ${t}` } : {},
      body: fd,
    });
    return _json(r);
  },
  listRules: () => _fetch("/api/buyers/bid-rules").then(_json),
  getRule: (id: number) => _fetch(`/api/buyers/bid-rules/${id}`).then(_json),
  createRule: (rule: Record<string, unknown>) =>
    _fetch("/api/buyers/bid-rules", { method: "POST", body: JSON.stringify(rule) }).then(_json),
  updateRule: (id: number, patch: Record<string, unknown>) =>
    _fetch(`/api/buyers/bid-rules/${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then(_json),
  deleteRule: (id: number) =>
    _fetch(`/api/buyers/bid-rules/${id}`, { method: "DELETE" }).then(_json),
  testRule: (id: number) =>
    _fetch(`/api/buyers/bid-rules/${id}/test`, { method: "POST" }).then(_json),
  wonCars: (status?: string) =>
    _fetch(`/api/buyers/won-cars${status ? `?status=${status}` : ""}`).then(_json),
  declineMatch: (matchId: number) =>
    _fetch(`/api/buyers/won-cars/${matchId}/decline`, { method: "POST" }).then(_json),
  ledger: () => _fetch("/api/buyers/ledger").then(_json),
  listDisputes: () => _fetch("/api/buyers/disputes").then(_json),
  openDispute: (b: { match_id: number; reason: string; description?: string; evidence_urls?: string[] }) =>
    _fetch("/api/buyers/disputes", { method: "POST", body: JSON.stringify(b) }).then(_json),
};
