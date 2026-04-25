"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitQuote } from "@/lib/api";

type Form = {
  year: string; make: string; model: string; vin: string;
  title_status: string; condition: string; zip_code: string;
  phone: string; email: string;
};

const STEPS = ["vehicle", "title", "condition", "zip", "contact"] as const;

export default function QuoteWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>({
    year: "", make: "", model: "", vin: "",
    title_status: "", condition: "", zip_code: "",
    phone: "", email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitQuote({
        vin: form.vin || `UNK_${form.year}_${form.make}_${form.model}`,
        year: parseInt(form.year),
        make: form.make,
        model: form.model,
        condition: form.condition,
        title_status: form.title_status,
        weight_lbs: 3000,
        zip_code: form.zip_code,
        photo_count: 0,
      });
      router.push(`/quote/result?id=${result.offer_id}&status=${result.status}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const set = (k: keyof Form) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canAdvance = (() => {
    if (step === 0) return form.year && form.make && form.model;
    if (step === 1) return !!form.title_status;
    if (step === 2) return !!form.condition;
    if (step === 3) return form.zip_code.length >= 5;
    if (step === 4) return form.phone.length >= 10;
    return false;
  })();

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-md mx-auto pt-12">
        <h1 className="text-2xl font-bold mb-6">
          Step {step + 1} of {STEPS.length}
        </h1>

        {step === 0 && (
          <div className="space-y-4">
            <Label>Year</Label>
            <Input value={form.year} onChange={(e) => set("year")(e.target.value)} />
            <Label>Make</Label>
            <Input value={form.make} onChange={(e) => set("make")(e.target.value)} />
            <Label>Model</Label>
            <Input value={form.model} onChange={(e) => set("model")(e.target.value)} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Label>Title Status</Label>
            {["clean", "salvage", "rebuilt", "no_title"].map((t) => (
              <Button
                key={t}
                variant={form.title_status === t ? "default" : "outline"}
                className="w-full"
                onClick={() => set("title_status")(t)}
              >{t.replace("_", " ")}</Button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Condition</Label>
            {["runs", "starts_no_drive", "dead", "wrecked"].map((t) => (
              <Button
                key={t}
                variant={form.condition === t ? "default" : "outline"}
                className="w-full"
                onClick={() => set("condition")(t)}
              >{t.replace("_", " ")}</Button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Zip code</Label>
            <Input value={form.zip_code} onChange={(e) => set("zip_code")(e.target.value)} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => set("email")(e.target.value)} />
          </div>
        )}

        {error && <p className="text-red-600 mt-4">{error}</p>}

        <div className="flex gap-2 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="flex-1"
              disabled={!canAdvance}
              onClick={() => setStep((s) => s + 1)}
            >Next</Button>
          ) : (
            <Button
              className="flex-1"
              disabled={!canAdvance || submitting}
              onClick={submit}
            >{submitting ? "Getting offer..." : "Get my offer"}</Button>
          )}
        </div>
      </div>
    </main>
  );
}
