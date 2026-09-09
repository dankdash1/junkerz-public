"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/Logo";
import { SITE } from "@/lib/site";
import { getOfferForToken, declineOffer } from "@/lib/api";

const mono = "font-[family-name:var(--font-geist-mono)]";

type Reason = "price" | "timing" | "already_sold" | "other";

const REASONS: { key: Reason; label: string; sub: string }[] = [
  { key: "price", label: "The price is too low",
    sub: "Tell us what you'd take and we'll come back to you." },
  { key: "timing", label: "Not ready to sell yet",
    sub: "We'll check back rather than keep chasing you." },
  { key: "already_sold", label: "I already sold it",
    sub: "Good for you. We'll close it out and stop emailing." },
  { key: "other", label: "Something else",
    sub: "Tell us in your own words." },
];

type Offer = {
  id?: number; year?: number; make?: string; model?: string;
  offer_cents?: number;
};

export default function DeclinePage() {
  // Next 14: params is a plain object, and the other token pages all read it
  // through useParams. Matching them keeps this consistent.
  const token = String(useParams()?.token ?? "");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [reason, setReason] = useState<Reason | null>(null);
  const [wanted, setWanted] = useState("");
  const [compName, setCompName] = useState("");
  const [compAmt, setCompAmt] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ message: string; callback: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    getOfferForToken(token)
      .then((d) => setOffer(d.offer || null))
      .catch(() => setLoadErr("This link has expired. Call us and we'll sort it out."));
  }, [token]);

  const dollars = (c?: number) =>
    typeof c === "number" ? `$${(c / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : null;

  async function submit() {
    if (!reason) return;
    setBusy(true); setErr(null);
    try {
      const toCents = (v: string) => {
        const n = parseFloat(v.replace(/[^0-9.]/g, ""));
        return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
      };
      const r = await declineOffer(token, {
        reason,
        note: note.trim() || undefined,
        desired_cents: toCents(wanted),
        competitor_name: compName.trim() || undefined,
        competitor_cents: toCents(compAmt),
        wants_callback: reason === "price",
      });
      setDone({ message: r.message || "Thanks for telling us.", callback: !!r.wants_callback });
    } catch {
      setErr("Couldn't send that. Give us a call and we'll handle it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
          <Link href="/"><Logo height={30} /></Link>
          <a href={SITE.phoneHref}
             className={`flex items-center gap-1.5 text-sm font-bold text-zinc-800 ${mono}`}>
            <Phone className="h-4 w-4" /> {SITE.phone}
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 pb-16 pt-8">
        {loadErr && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
            <p className="text-zinc-700">{loadErr}</p>
            <a href={SITE.phoneHref} className="mt-4 inline-block">
              <Button className="h-12 gap-2 px-6 font-bold">
                <Phone className="h-4 w-4" /> {SITE.phone}
              </Button>
            </a>
          </div>
        )}

        {done && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50">
              <Check className="h-7 w-7 text-brand-600" />
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
              {done.callback ? "We'll be in touch" : "Thanks for telling us"}
            </h1>
            <p className="mt-3 text-zinc-600">{done.message}</p>
            {done.callback && (
              <p className="mt-4 text-sm text-zinc-500">
                Want it sorted sooner? Call {SITE.phone} and ask for a better number.
              </p>
            )}
            <Link href="/" className="mt-6 inline-block">
              <Button variant="outline" className="h-11 px-6 font-semibold">
                Back to Junkerz
              </Button>
            </Link>
          </div>
        )}

        {!loadErr && !done && (
          <>
            <h1 className="text-balance text-2xl font-extrabold tracking-tight">
              Not right? Tell us why.
            </h1>
            <p className="mt-2 text-zinc-600">
              Takes ten seconds, and if it&apos;s the money we&apos;ll come back
              with a better number.
            </p>

            {offer && (
              <div className="mt-5 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <div className="text-sm text-zinc-500">
                  {[offer.year, offer.make, offer.model].filter(Boolean).join(" ") || "Your vehicle"}
                </div>
                <div className={`text-2xl font-bold ${mono}`}>
                  {dollars(offer.offer_cents) || "—"}
                  <span className="ml-2 text-sm font-medium text-zinc-500">our offer</span>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-2.5">
              {REASONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setReason(r.key)}
                  className={`w-full rounded-xl border px-4 py-3.5 text-left transition
                    ${reason === r.key
                      ? "border-brand-600 bg-brand-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{r.label}</span>
                    {reason === r.key && <Check className="h-5 w-5 text-brand-600" />}
                  </div>
                  <p className="mt-0.5 text-sm text-zinc-500">{r.sub}</p>
                </button>
              ))}
            </div>

            {reason === "price" && (
              <div className="mt-5 space-y-4 rounded-xl border border-brand-200 bg-brand-50 p-4">
                <div>
                  <Label htmlFor="wanted">What would you take?</Label>
                  <Input id="wanted" inputMode="decimal" value={wanted}
                    onChange={(e) => setWanted(e.target.value)}
                    placeholder="$600" className="bg-white" />
                  <p className="mt-1 text-xs text-zinc-600">
                    Give us a real number and we&apos;ll tell you straight if we can do it.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="cn">Better offer from</Label>
                    <Input id="cn" value={compName} onChange={(e) => setCompName(e.target.value)}
                      placeholder="optional" className="bg-white" />
                  </div>
                  <div>
                    <Label htmlFor="ca">How much?</Label>
                    <Input id="ca" inputMode="decimal" value={compAmt}
                      onChange={(e) => setCompAmt(e.target.value)}
                      placeholder="optional" className="bg-white" />
                  </div>
                </div>
              </div>
            )}

            {reason && (
              <div className="mt-5">
                <Label htmlFor="note">Anything else? (optional)</Label>
                <textarea id="note" rows={3} value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white p-3 text-[15px] outline-none focus:border-brand-600"
                  placeholder="Tell us anything that would change our number." />
              </div>
            )}

            {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

            <Button onClick={submit} disabled={!reason || busy}
              className="mt-6 h-14 w-full gap-2 text-base font-bold">
              {busy ? "Sending…" : reason === "price" ? "Send it and call me" : "Send"}
              {!busy && <ArrowRight className="h-5 w-5" />}
            </Button>

            <p className="mt-5 text-center text-sm text-zinc-500">
              Changed your mind?{" "}
              <Link href={`/schedule/${token}`} className="font-semibold text-brand-700 underline">
                Accept the offer instead
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
