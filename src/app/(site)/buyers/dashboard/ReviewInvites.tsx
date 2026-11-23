"use client";

import { useEffect, useState, type FormEvent } from "react";
import { buyerApi, type ReviewInvite, type ReviewResponse } from "@/lib/buyer-api";
import type { Lang } from "@/lib/buyer-lang";

const copy = {
  en: {
    heading: "Private vehicle invitations", loadFailed: "Couldn’t load your vehicle invitations.",
    vehicle: "Vehicle under review", deadline: "Respond by", details: "Vehicle details",
    mileage: "Mileage", condition: "Condition", title: "Title", possession: "Title in hand",
    runs: "Runs", starts: "Starts", catalytic: "Catalytic converter", yes: "Yes", no: "No", unknown: "Unknown",
    photos: "View vehicle photos", photo: "Vehicle photo", photoFailed: "Photo unavailable",
    payment: "Firm bid (USD)", pickupStart: "Pickup window starts", pickupEnd: "Pickup window ends",
    expiry: "Bid expires", timezone: "Enter times in your device’s time zone",
    submit: "Submit firm bid", pass: "Pass", saving: "Saving…",
    instructions: "Your bid commits you to the amount and pickup window if assigned. Junkerz will contact you if the seller accepts.",
    bidSaved: "Firm bid recorded", passSaved: "Pass recorded", expired: "Invitation expired",
    amountError: "Enter a positive amount in dollars and cents.",
    timeError: "Set the bid expiry before the invitation deadline and pickup, then enter a pickup end time after the start.",
    stale: "This invitation changed or expired. Refresh for its current status.",
    ineligible: "Your account or bid rule can’t cover this bid.",
    saveFailed: "Couldn’t save your response. Try again.",
  },
  es: {
    heading: "Invitaciones privadas de vehículos", loadFailed: "No se pudieron cargar tus invitaciones.",
    vehicle: "Vehículo en revisión", deadline: "Responde antes de", details: "Datos del vehículo",
    mileage: "Millaje", condition: "Condición", title: "Título", possession: "Título en mano",
    runs: "Funciona", starts: "Arranca", catalytic: "Convertidor catalítico", yes: "Sí", no: "No", unknown: "Desconocido",
    photos: "Ver fotos del vehículo", photo: "Foto del vehículo", photoFailed: "Foto no disponible",
    payment: "Oferta firme (USD)", pickupStart: "Inicio del horario de recogida", pickupEnd: "Fin del horario de recogida",
    expiry: "La oferta vence", timezone: "Ingresa las horas en la zona horaria de tu dispositivo",
    submit: "Enviar oferta firme", pass: "Pasar", saving: "Guardando…",
    instructions: "Si te asignan el vehículo, tu oferta te compromete al monto y horario de recogida indicados. Junkerz te contactará si el vendedor acepta.",
    bidSaved: "Oferta firme registrada", passSaved: "Respuesta registrada", expired: "Invitación vencida",
    amountError: "Ingresa una cantidad positiva en dólares y centavos.",
    timeError: "Indica un vencimiento antes del límite de la invitación y de la recogida. El fin de la recogida debe ser después del inicio.",
    stale: "Esta invitación cambió o venció. Recarga la página para ver su estado.",
    ineligible: "Tu cuenta o regla de compra no puede cubrir esta oferta.",
    saveFailed: "No se pudo guardar tu respuesta. Intenta de nuevo.",
  },
};

function formatTime(value: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: "America/Chicago", timeZoneName: "short",
  }).format(new Date(value));
}

function ReviewPhoto({ inviteId, photoId, index, lang }: {
  inviteId: number; photoId: number; index: number; lang: Lang;
}) {
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let url = "";
    buyerApi.reviewPhoto(inviteId, photoId, controller.signal).then((blob) => {
      if (controller.signal.aborted) return;
      url = URL.createObjectURL(blob);
      setSrc(url);
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [inviteId, photoId]);

  const t = copy[lang];
  if (failed) return <p className="text-sm text-slate-600">{t.photoFailed}</p>;
  if (!src) return null;
  return (
    <a href={src} target="_blank" rel="noreferrer" className="block rounded border bg-slate-50">
      {/* Authenticated image bytes are available only as a local object URL. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`${t.photo} ${index + 1}`} className="aspect-[4/3] w-full object-contain rounded" />
    </a>
  );
}

function InviteCard({ invitation, lang }: { invitation: ReviewInvite; lang: Lang }) {
  const t = copy[lang];
  const [invite, setInvite] = useState(invitation);
  const [showPhotos, setShowPhotos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"amountError" | "timeError" | "stale" | "ineligible" | "saveFailed" | null>(null);
  const { vehicle, invite_id: inviteId } = invite;
  const name = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || t.vehicle;
  const city = [vehicle.offer_city, vehicle.offer_state].filter(Boolean).join(", ");
  const boolean = (value: boolean | null) => value === null ? null : value ? t.yes : t.no;
  const words = (value: string | null, spanish: Record<string, string>) =>
    value && lang === "es" ? spanish[value] ?? value : value;
  const details = [
    [t.mileage, vehicle.mileage == null ? null : new Intl.NumberFormat(lang).format(vehicle.mileage)],
    [t.condition, words(vehicle.condition, { runs: "funciona", "does-not-run": "no funciona", wrecked: "chocado" })],
    [t.title, words(vehicle.title_status, { clean: "limpio", salvage: "salvamento", rebuilt: "reconstruido", missing: "faltante", unknown: t.unknown })],
    [t.possession, words(vehicle.title_in_hand, { yes: t.yes, no: t.no, unknown: t.unknown })],
    [t.runs, boolean(vehicle.runs)], [t.starts, boolean(vehicle.starts)], [t.catalytic, boolean(vehicle.has_catalytic)],
  ].filter(([, value]) => value != null && value !== "");

  async function send(response: ReviewResponse) {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const receipt = await buyerApi.respondToReview(inviteId, response);
      setInvite((previous) => ({ ...previous, ...receipt }));
    } catch (err) {
      const code = (err as Error).message;
      if (["round_expired", "quote_closed", "invite_not_found", "response_already_recorded"].includes(code)) setError("stale");
      else if (code === "buyer_no_longer_eligible") setError("ineligible");
      else if (["invalid_bid_expiry", "invalid_pickup_window", "invalid_datetime"].includes(code)) setError("timeError");
      else setError("saveFailed");
    } finally {
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const rawAmount = String(fields.get("bid") ?? "").trim();
    const amount = lang === "es" ? rawAmount.replace(",", ".") : rawAmount;
    const money = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(amount);
    const cents = money ? Number(money[1]) * 100 + Number((money[2] ?? "").padEnd(2, "0")) : 0;
    if (cents < 1) return setError("amountError");

    const start = new Date(String(fields.get("start")));
    const end = new Date(String(fields.get("end")));
    const expiry = new Date(String(fields.get("expiry")));
    if (!(Date.now() < +expiry && +expiry <= Date.parse(invite.expires_at) && expiry <= start && start < end)) {
      return setError("timeError");
    }
    void send({
      response: "bid", bid_cents: cents, pickup_start_at: start.toISOString(),
      pickup_end_at: end.toISOString(), bid_expires_at: expiry.toISOString(),
    });
  }

  const expired = Date.parse(invite.expires_at) <= Date.now();
  const inputClass = "block w-full min-h-11 mt-1 py-2 px-2 rounded border border-slate-400 bg-white font-normal";
  return (
    <article className="border border-slate-200 bg-white rounded-lg p-4 sm:p-5">
      <div className="flex flex-wrap justify-between gap-x-5 gap-y-2">
        <div>
          <h3 className="text-lg font-bold">{name}</h3>
          {city && <p className="text-sm text-slate-600">{city}</p>}
        </div>
        <p className="text-sm font-medium text-slate-700">{t.deadline} <time dateTime={invite.expires_at}>{formatTime(invite.expires_at, lang)}</time></p>
      </div>
      {!!details.length && (
        <dl className="mt-4 grid gap-x-4 gap-y-2 grid-cols-2 sm:grid-cols-4 text-sm" aria-label={t.details}>
          {details.map(([label, value]) => <div key={label}><dt className="text-slate-600">{label}</dt><dd className="font-medium">{value}</dd></div>)}
        </dl>
      )}
      {!!invite.approved_photo_ids.length && (
        <div className="mt-4">
          <button type="button" aria-expanded={showPhotos} className="text-sm font-medium text-brand-700 underline min-h-10"
            onClick={() => setShowPhotos(!showPhotos)}>{t.photos}</button>
          {showPhotos && <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {invite.approved_photo_ids.map((photoId, index) => <ReviewPhoto key={photoId} {...{ inviteId, photoId, index, lang }} />)}
          </div>}
        </div>
      )}

      <div className="border-t border-slate-200 pt-4 mt-4">
        {invite.response === "bid" && invite.bid_cents != null && invite.pickup_start_at && invite.pickup_end_at && invite.bid_expires_at ? (
          <div role="status" className="text-sm">
            <p className="font-semibold text-brand-800">{t.bidSaved} · {new Intl.NumberFormat(lang, { style: "currency", currency: "USD" }).format(invite.bid_cents / 100)}</p>
            <p className="mt-1">{formatTime(invite.pickup_start_at, lang)} – {formatTime(invite.pickup_end_at, lang)}</p>
            <p className="mt-1 text-slate-600">{t.expiry} {formatTime(invite.bid_expires_at, lang)}</p>
          </div>
        ) : invite.response === "pass" ? (
          <p role="status" className="text-sm font-semibold">{t.passSaved}</p>
        ) : expired ? (
          <p className="text-sm font-semibold">{t.expired}</p>
        ) : (
          <form onSubmit={submit}>
            <p className="text-sm text-slate-700">{t.instructions}</p>
            <p className="text-sm mt-2">{t.timezone} ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
            <fieldset disabled={saving} className="mt-3 grid sm:grid-cols-2 gap-3 text-sm font-medium">
              <label>{t.payment}<input className={inputClass} name="bid" inputMode="decimal" required /></label>
              <label>{t.expiry}<input className={inputClass} name="expiry" type="datetime-local" required /></label>
              <label>{t.pickupStart}<input className={inputClass} name="start" type="datetime-local" required /></label>
              <label>{t.pickupEnd}<input className={inputClass} name="end" type="datetime-local" required /></label>
            </fieldset>
            {error && <p role="alert" className="text-sm font-medium text-red-700 mt-3">{t[error]}</p>}
            <div className="flex gap-3 mt-4">
              <button disabled={saving} type="submit" className="min-h-11 px-4 py-2 rounded bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60">{saving ? t.saving : t.submit}</button>
              <button disabled={saving} type="button" onClick={() => void send({ response: "pass" })}
                className="min-h-11 px-4 py-2 rounded border border-slate-400 font-semibold hover:bg-slate-50 disabled:opacity-60">{t.pass}</button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

export default function ReviewInvites({ lang }: { lang: Lang }) {
  const [invites, setInvites] = useState<ReviewInvite[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    buyerApi.reviewRounds().then(({ invites }) => {
      if (mounted) setInvites(invites);
    }).catch((err: Error) => {
      if (mounted && err.message !== "HTTP 404") setError(true);
    });
    return () => { mounted = false; };
  }, []);

  const t = copy[lang];
  if (error) return <p role="alert" className="text-sm text-red-700 mb-4">{t.loadFailed}</p>;
  if (!invites.length) return null;
  return (
    <section aria-labelledby="private-vehicle-invitations" className="mb-8">
      <h2 id="private-vehicle-invitations" className="text-lg font-bold mb-3">{t.heading}</h2>
      <div className="space-y-3">{invites.map((invite) => <InviteCard key={invite.invite_id} invitation={invite} lang={lang} />)}</div>
    </section>
  );
}
