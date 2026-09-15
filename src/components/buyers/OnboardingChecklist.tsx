"use client";
import type { OnboardingStatus } from "@/lib/buyer-api";

export default function OnboardingChecklist({ status, preview = false }: { status: OnboardingStatus; preview?: boolean }) {
  return <section aria-label="Buyer onboarding checklist" className="rounded border bg-white p-5 space-y-4">
    <h2 className="font-semibold">Buyer onboarding</h2>
    <p className="text-sm text-slate-600">Requirements version {status.policy_version}. Requested optional documents do not hold up approval.</p>
    <ul className="space-y-4">
      {status.items.filter(item => item.requested || item.required).map(item => <li key={item.key} className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{item.label}</p>
          <p className="text-xs text-slate-500">{item.required ? 'Required' : 'Requested · optional'}</p>
          {!preview && <p className="text-sm">{item.review_status === 'uploaded' ? 'Uploaded · awaiting review' : item.review_status === 'signed' ? 'Signed' : ['approved', 'verified', 'valid'].includes(item.review_status) ? 'Reviewed' : item.review_status === 'rejected' ? 'Rejected · upload a replacement' : item.completed ? 'Uploaded' : 'Incomplete'}</p>}
        </div>
        {!preview && !item.completed && <a className="text-sm text-brand-700 underline" href={item.next_action_url}>Complete {item.label}</a>}
      </li>)}
    </ul>
    {!preview && <div className="border-t pt-3 text-sm space-y-1">
      <p>{status.approved ? 'Business approved' : status.approval_ready ? 'Ready for staff approval' : 'Business approval pending'}</p>
      <p>{status.payment_ready ? 'Payment method ready' : <a className="underline" href="/buyers/settings">Add a payment method</a>}</p>
      {status.approved && !status.active && <p>Account inactive{status.suspended_reason ? `: ${status.suspended_reason}` : ''}. Contact Junkerz for assistance.</p>}
      <p className="text-slate-500">Business approval and payment setup are separate. Vehicle eligibility also depends on your bids, balance and pickup limits.</p>
    </div>}
  </section>;
}
