"use client";

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { API_BASE } from "@/lib/api-base";
import { PICKUPS_LIVE, SITE } from "@/lib/site";

type ResponseKind = "timing" | "callback" | "outside_offer" | "details";
type Detail = "mileage" | "title_status" | "title_in_hand" | "odometer" | "vehicle" | "damage";
type Offer = { vehicle: string; offer_cents: number | null; requested_details: Detail[] };

const fieldClass = "mt-1 block min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 focus-visible:outline-brand-700";
const primaryClass = "flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-center font-bold text-white hover:bg-brand-800 disabled:opacity-60";
const secondaryClass = "min-h-11 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-100 aria-pressed:border-brand-700 aria-pressed:bg-red-50 aria-pressed:text-brand-800";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold">{label}{children}</label>;
}

export default function OfferResponseForm({ token, es }: { token: string; es: boolean }) {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [kind, setKind] = useState<ResponseKind | null>(null);
  const [saved, setSaved] = useState<ResponseKind | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestKey = useRef<string | null>(null);
  const endpoint = `${API_BASE}/api/public/junkerz/seller/check-in/${encodeURIComponent(token)}`;
  const lang = es ? "?lang=es" : "";
  const tr = (english: string, spanish: string) => es ? spanish : english;

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);
    setOffer(null);
    setSaved(null);
    setKind(window.location.hash === "#outside-offer" ? "outside_offer" : null);
    requestKey.current = null;
    fetch(endpoint, { cache: "no-store", referrerPolicy: "no-referrer", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setOffer(await response.json());
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadError(true);
      });
    return () => controller.abort();
  }, [endpoint]);

  const choices: { key: ResponseKind; label: string }[] = [
    { key: "outside_offer", label: tr("Share another offer", "Compartir otra oferta") },
    { key: "timing", label: tr("Tell us when you’ll sell", "Indicar cuándo venderá") },
    { key: "callback", label: tr("Request a call", "Pedir una llamada") },
  ];
  if (offer?.requested_details.length) {
    choices.push({ key: "details", label: tr("Send requested details", "Enviar datos solicitados") });
  }

  function select(next: ResponseKind) {
    if (kind !== next || saved) requestKey.current = null;
    setSaved(null);
    setError("");
    setKind(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!kind || busy) return;
    setBusy(true);
    setError("");
    try {
      const fields = new FormData(event.currentTarget);
      for (const [key, value] of Array.from(fields.entries())) {
        if (value === "" || (value instanceof File && !value.name)) fields.delete(key);
      }
      if (fields.get("callback_at")) {
        fields.set("callback_at", new Date(String(fields.get("callback_at"))).toISOString());
      }
      requestKey.current ??= crypto.randomUUID();
      fields.set("request_key", requestKey.current);
      fields.set("kind", kind);
      const response = await fetch(endpoint, { method: "POST", body: fields, referrerPolicy: "no-referrer" });
      if (!response.ok) {
        if (response.status === 404) {
          setLoadError(true);
          return;
        }
        if (response.status === 413 || response.status === 415) {
          setError(tr("Use a JPG, PNG, WebP, or permitted PDF of 8 MB or less.", "Use un JPG, PNG, WebP o PDF permitido de hasta 8 MB."));
          return;
        }
        if (response.status === 400) {
          setError(tr("Check the details and try again. If you added a quote date, its expiration should be on or after that date.",
            "Revise los datos e inténtelo de nuevo. Si indicó una fecha de cotización, el vencimiento debe ser ese día o después."));
          return;
        }
        throw new Error();
      }
      requestKey.current = null;
      setSaved(kind);
      setKind(null);
    } catch {
      setError(tr("We couldn’t save your response. Try again or call us.", "No pudimos guardar su respuesta. Inténtelo de nuevo o llámenos."));
    } finally {
      setBusy(false);
    }
  }

  const requested = offer?.requested_details ?? [];
  return (
    <main lang={es ? "es" : "en"} className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b-4 border-brand-700 bg-white">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-5">
          <Link href="/"><Logo height={32} /></Link>
          <a className="text-sm font-bold underline underline-offset-2" href={SITE.phoneHref}>{SITE.phone}</a>
        </div>
      </header>
      <div className="mx-auto max-w-lg px-4 py-7 sm:px-5">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7">
          {loadError ? (
            <p role="alert">{tr("This offer link is unavailable. Call us for help.", "Este enlace de oferta ya no está disponible. Llámenos para recibir ayuda.")}</p>
          ) : offer ? (
            <>
              <p className="text-sm font-medium text-zinc-600">{offer.vehicle}</p>
              <h1 className="mt-1 text-2xl font-bold">{tr("Your cash offer", "Su oferta en efectivo")}</h1>
              {offer.offer_cents !== null && (
                <p className="my-3 text-5xl font-black tracking-tight">
                  {new Intl.NumberFormat(es ? "es-US" : "en-US", {
                    style: "currency", currency: "USD",
                    minimumFractionDigits: offer.offer_cents % 100 ? 2 : 0,
                    maximumFractionDigits: 2,
                  }).format(offer.offer_cents / 100)}
                </p>
              )}
              {PICKUPS_LIVE && (
                <Link prefetch={false} href={`/schedule/${token}${lang}`} className={`${primaryClass} mt-4`}>
                  {tr("Accept & schedule pickup", "Aceptar y programar la grúa")}
                </Link>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {choices.map((choice) => (
                  <button key={choice.key} type="button" disabled={busy} aria-pressed={kind === choice.key}
                    className={secondaryClass} onClick={() => select(choice.key)}>
                    {saved === "outside_offer" && choice.key === "outside_offer"
                      ? tr("Add another offer", "Añadir otra oferta") : choice.label}
                  </button>
                ))}
              </div>

              {saved && (
                <p className="mt-5 rounded-lg bg-zinc-100 p-3 text-sm font-medium" role="status">
                  {saved === "callback" && tr("We received your callback request.", "Recibimos su solicitud de llamada.")}
                  {saved !== "callback" && tr("Thanks. We saved your response. Your original offer is still available.",
                    "Gracias. Guardamos su respuesta. Su oferta original sigue disponible.")}
                </p>
              )}

              {kind && (
                <form key={kind} className="mt-5 space-y-4 border-t border-zinc-200 pt-5" onSubmit={submit}>
                  <h2 className="text-lg font-bold">{choices.find((choice) => choice.key === kind)?.label}</h2>
                  {(kind === "timing" || kind === "outside_offer") && (
                    <Field label={tr("When are you thinking of selling?", "¿Cuándo piensa vender?")}>
                      <select name="readiness" className={fieldClass} required={kind === "timing"} defaultValue="">
                        <option value="">{tr("Select an option", "Seleccione una opción")}</option>
                        <option value="now">{tr("Today", "Hoy")}</option>
                        <option value="this_week">{tr("This week", "Esta semana")}</option>
                        <option value="later">{tr("Later", "Más adelante")}</option>
                        <option value="not_sure">{tr("Still deciding", "Aún no lo sé")}</option>
                      </select>
                    </Field>
                  )}
                  {kind === "timing" && (
                    <Field label={tr("Preferred date (optional)", "Fecha preferida (opcional)")}>
                      <input type="date" name="sell_on" className={fieldClass} />
                    </Field>
                  )}
                  {kind === "callback" && (
                    <Field label={tr("Best time to call, your local time (optional)", "Mejor hora para llamar, hora local (opcional)")}>
                      <input type="datetime-local" name="callback_at" className={fieldClass} />
                    </Field>
                  )}
                  {kind === "outside_offer" && (
                    <>
                      <Field label={tr("Other company", "Otra compañía")}>
                        <input name="company" className={fieldClass} required maxLength={120} />
                      </Field>
                      <Field label={tr("Their cash offer in dollars", "Su oferta en efectivo, en dólares")}>
                        <input name="amount" className={fieldClass} required type="number" inputMode="decimal" min=".01" max="100000" step=".01" />
                      </Field>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={tr("Quote date (optional)", "Fecha de la oferta (opcional)")}>
                          <input name="quoted_on" className={fieldClass} type="date" />
                        </Field>
                        <Field label={tr("Expires on (optional)", "Vence el (opcional)")}>
                          <input name="expires_on" className={fieldClass} type="date" />
                        </Field>
                      </div>
                      <Field label={tr("Pickup fees or other conditions (optional)", "Cargos de recogida u otras condiciones (opcional)")}>
                        <textarea name="conditions" className={fieldClass} maxLength={500} rows={2} />
                      </Field>
                      <Field label={tr("Amount you received if you sold it (optional)", "Cantidad recibida si ya lo vendió (opcional)")}>
                        <input name="realized_amount" className={fieldClass} type="number" inputMode="decimal" min=".01" max="100000" step=".01" />
                      </Field>
                      <Field label={tr("Written quote, photo or PDF (optional)", "Oferta escrita, foto o PDF (opcional)")}>
                        <input name="outside_offer" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className={fieldClass} />
                      </Field>
                    </>
                  )}
                  {kind === "details" && (
                    <>
                      {requested.includes("mileage") && (
                        <Field label={tr("Mileage", "Millaje")}>
                          <input name="mileage" type="number" inputMode="numeric" min="0" max="999999" step="1" className={fieldClass} />
                        </Field>
                      )}
                      {requested.includes("title_status") && (
                        <Field label={tr("Title status", "Tipo de título")}>
                          <select name="title_status" className={fieldClass} defaultValue="">
                            <option value="">{tr("Select an option", "Seleccione una opción")}</option>
                            <option value="clean">{tr("Clean", "Limpio")}</option>
                            <option value="salvage">Salvage</option>
                            <option value="rebuilt">{tr("Rebuilt", "Reconstruido")}</option>
                            <option value="missing">{tr("Missing", "Sin título")}</option>
                            <option value="unknown">{tr("Unsure", "No estoy seguro")}</option>
                          </select>
                        </Field>
                      )}
                      {requested.includes("title_in_hand") && (
                        <Field label={tr("Do you have the title in hand?", "¿Tiene el título a mano?")}>
                          <select name="title_in_hand" className={fieldClass} defaultValue="">
                            <option value="">{tr("Select an option", "Seleccione una opción")}</option>
                            <option value="yes">{tr("Yes", "Sí")}</option>
                            <option value="no">No</option>
                            <option value="unknown">{tr("Unsure", "No estoy seguro")}</option>
                          </select>
                        </Field>
                      )}
                      {([
                        ["odometer", tr("Odometer photo", "Foto del odómetro")],
                        ["vehicle", tr("Vehicle photo", "Foto del vehículo")],
                        ["damage", tr("Damage photo", "Foto de los daños")],
                      ] as const).filter(([key]) => requested.includes(key)).map(([key, label]) => (
                        <Field key={key} label={label}>
                          <input name={key} type="file" accept="image/jpeg,image/png,image/webp" className={fieldClass} />
                        </Field>
                      ))}
                    </>
                  )}
                  {kind !== "outside_offer" && (
                    <Field label={tr("Note for Junkerz (optional)", "Nota para Junkerz (opcional)")}>
                      <textarea name="note" maxLength={500} rows={2} className={fieldClass} />
                    </Field>
                  )}
                  {error && <p role="alert" className="text-sm font-semibold text-red-800">{error}</p>}
                  <button className={primaryClass} type="submit" disabled={busy}>
                    {busy ? tr("Sending…", "Enviando…") : tr("Send to Junkerz", "Enviar a Junkerz")}
                  </button>
                </form>
              )}
              <Link prefetch={false} href={`/decline/${token}${lang}`}
                className="mt-5 inline-block text-sm text-zinc-600 underline underline-offset-2">
                {tr("Decline offer", "Rechazar oferta")}
              </Link>
            </>
          ) : <p role="status">{tr("Loading your offer…", "Cargando su oferta…")}</p>}
        </section>
      </div>
    </main>
  );
}
