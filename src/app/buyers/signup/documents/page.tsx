"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { buyerApi, DocumentType } from "@/lib/buyer-api";

type DocSlot = {
  kind: DocumentType;
  label: string;
  description: string;
};

const SLOTS: DocSlot[] = [
  { kind: "w9", label: "W-9", description: "IRS Form W-9 (required for any buyer)." },
  { kind: "license", label: "Business license", description: "State dealer / dismantler / scrap license." },
  { kind: "insurance", label: "Insurance certificate", description: "Proof of liability coverage." },
  { kind: "id", label: "Photo ID", description: "Driver's license or state ID for the contact name." },
];

type UploadState = {
  uploading: boolean;
  uploadedId?: number;
  error?: string;
  fileName?: string;
};

export default function BuyerSignupDocuments() {
  const router = useRouter();
  const [state, setState] = useState<Record<DocumentType, UploadState>>({
    w9: { uploading: false },
    license: { uploading: false },
    insurance: { uploading: false },
    id: { uploading: false },
  });
  const [skipBusy, setSkipBusy] = useState(false);

  // If they hit this page without a token (rare — auto-login failed),
  // bounce to login.
  useEffect(() => {
    if (typeof window !== "undefined" && !window.localStorage.getItem("buyer_token")) {
      router.replace("/buyers/login?signed_up=1");
    }
  }, [router]);

  async function uploadOne(kind: DocumentType, file: File) {
    setState((s) => ({ ...s, [kind]: { uploading: true, fileName: file.name } }));
    try {
      const r = await buyerApi.uploadDocument(kind, file);
      setState((s) => ({
        ...s,
        [kind]: {
          uploading: false,
          uploadedId: r.document_id,
          fileName: file.name,
        },
      }));
    } catch (e: unknown) {
      setState((s) => ({
        ...s,
        [kind]: {
          uploading: false,
          error: (e as Error)?.message ?? "Upload failed",
          fileName: file.name,
        },
      }));
    }
  }

  function onPick(kind: DocumentType, ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;
    void uploadOne(kind, f);
  }

  const allUploaded = SLOTS.every((s) => state[s.kind].uploadedId);

  function done() {
    router.replace("/buyers/dashboard");
  }
  async function skip() {
    setSkipBusy(true);
    // No backend call needed — admin can chase missing docs later
    router.replace("/buyers/dashboard");
  }

  return (
    <main className="max-w-xl mx-auto pt-12 px-6 pb-16">
      <h1 className="text-2xl font-bold mb-2">Upload your documents</h1>
      <p className="text-sm text-slate-600 mb-6">
        We need these on file before your account can be approved. Each file
        accepts PDF, PNG, JPG up to 10 MB.
      </p>

      <div className="space-y-4">
        {SLOTS.map((slot) => {
          const s = state[slot.kind];
          return (
            <div key={slot.kind} className="border rounded p-4 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-base">{slot.label}</Label>
                  <p className="text-xs text-slate-500 mt-1">{slot.description}</p>
                </div>
                <div className="text-xs flex-shrink-0">
                  {s.uploadedId ? (
                    <span className="text-emerald-700 font-medium">✓ uploaded</span>
                  ) : s.uploading ? (
                    <span className="text-slate-500">Uploading…</span>
                  ) : s.error ? (
                    <span className="text-red-600">{s.error}</span>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  disabled={s.uploading}
                  onChange={(e) => onPick(slot.kind, e)}
                  className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border
                             file:text-xs file:font-medium file:bg-slate-50 hover:file:bg-slate-100"
                />
                {s.fileName && !s.error && (
                  <span className="text-xs text-slate-500 truncate">{s.fileName}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-3">
        <Button onClick={done} disabled={!allUploaded} className="flex-1">
          {allUploaded ? "Continue to dashboard" : "Upload all 4 to continue"}
        </Button>
        <Button
          variant="outline"
          onClick={skip}
          disabled={skipBusy}
          className="text-xs"
        >
          Skip for now
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-3 text-center">
        Skipping is fine, but you can&apos;t place bids until everything is on file.
      </p>
    </main>
  );
}
