"use client";
import type { OnboardingStatus } from "@/lib/buyer-api";
import { useBuyerLang, type Lang } from "@/lib/buyer-lang";
import { buyerText, itemLabel } from "@/components/buyers/buyerText";

export default function OnboardingChecklist({ status, preview = false, lang: langProp }: { status: OnboardingStatus; preview?: boolean; lang?: Lang }) {
  // Pages pass their language; on its own the checklist follows the buyers layout.
  const [sharedLang] = useBuyerLang({ account: false });
  const lang = langProp ?? sharedLang;
  const T = buyerText(lang);
  const t = T.checklist;
  const reviewText = (item: OnboardingStatus["items"][number]) =>
    item.review_status === 'uploaded' ? t.uploadedReview
      : item.review_status === 'signed' ? t.signed
      : item.review_status === 'saved' ? t.saved
      : ['approved', 'verified', 'valid'].includes(item.review_status) ? t.reviewed
      : item.review_status === 'rejected' ? t.rejected
      : item.completed ? t.uploaded : t.incomplete;
  return <section aria-label={t.aria} lang={lang} className="rounded border bg-white p-5 space-y-4">
    <h2 className="font-semibold">{t.title}</h2>
    <p className="text-sm text-slate-600">{t.policy(status.policy_version)}</p>
    <ul className="space-y-4">
      {status.items.filter(item => item.requested || item.required).map(item => <li key={item.key} className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{itemLabel(T, lang, item)}</p>
          <p className="text-xs text-slate-500">{item.required ? t.required : t.optional}</p>
          {!preview && <p className="text-sm">{reviewText(item)}</p>}
        </div>
        {!preview && !item.completed && <a className="text-sm text-brand-700 underline" href={item.next_action_url}>{t.complete(itemLabel(T, lang, item))}</a>}
      </li>)}
    </ul>
    {!preview && <div className="border-t pt-3 text-sm space-y-1">
      <p>{status.approved ? t.approved : status.approval_ready ? t.ready : t.pending}</p>
      {!status.items.some(i => i.key === 'card') && <p>{status.payment_ready ? t.paymentReady : <a className="underline" href="/buyers/settings">{t.addPayment}</a>}</p>}
      {status.approved && !status.active && <p>{t.inactive(status.suspended_reason)}</p>}
      <p className="text-slate-500">{t.footer}</p>
    </div>}
  </section>;
}
