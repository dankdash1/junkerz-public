"use client";

import {useRef, useState} from "react";
import {buyerApi} from "@/lib/buyer-api";

type Message = {id: string; sender_role: "supplier" | "staff"; text: string; created_at: string};

export default function YardDirectMessages({es}: {es: boolean}) {
  const [opened, setOpened] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [older, setOlder] = useState(false);
  const [rows, setRows] = useState<Message[]>([]);
  const [yard, setYard] = useState("");
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const nonce = useRef("");
  const label = es ? "Mensajes privados con Junkerz" : "Private messages with Junkerz";

  async function load(before?: string) {
    setBusy(true);
    setError("");
    try {
      const page = await buyerApi.yardDirectMessages(before);
      setRows(current => before ? [...page.messages, ...current] : page.messages);
      setOlder(page.has_older);
      setYard(page.yard_name);
      setLoaded(true);
    } catch {
      setError(es ? "No se pudo abrir la conversación." : "Could not open this yard conversation.");
    } finally { setBusy(false); }
  }
  async function send() {
    if (busy || !draft.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      nonce.current ||= crypto.randomUUID();
      const {message} = await buyerApi.sendYardDirectMessage(draft.trim(), nonce.current);
      setRows(current => current.some(row => row.id === message.id) ? current : [...current, message]);
      setDraft("");
      nonce.current = "";
      setNotice(es ? "Mensaje enviado a Junkerz." : "Message sent to Junkerz.");
    } catch {
      setError(es ? "No se confirmó el envío. Puede reintentar." : "Send unconfirmed. You can retry.");
    } finally { setBusy(false); }
  }

  return <section className="space-y-3 rounded-xl border bg-white p-4">
    <button className="min-h-11 font-semibold underline" aria-expanded={opened} onClick={() => {
      setOpened(!opened);
      if (!opened && !busy) void load();
    }}>{label}</button>
    {opened && <>
      <p>{es ? "Solo el personal de Junkerz y su patio pueden ver estos mensajes." : "Only Junkerz staff and your yard can see these messages."}</p>
      <button disabled={busy} className="underline" onClick={() => load()}>{es ? "Actualizar" : "Refresh messages"}</button>
      {older && <button disabled={busy} className="ml-4 underline" onClick={() => load(rows[0].id)}>{es ? "Ver anteriores" : "Load earlier messages"}</button>}
      {loaded && !rows.length && <p>{es ? "Sin mensajes." : "No messages yet."}</p>}
      {rows.map(row => <div key={row.id} className="rounded-lg bg-slate-50 p-3">
        <p className="text-sm font-semibold">{row.sender_role === "staff" ? `Junkerz → ${yard}` : `${yard} → Junkerz`}</p>
        <time className="text-xs" dateTime={row.created_at}>{new Date(row.created_at).toLocaleString()}</time>
        <p className="whitespace-pre-wrap break-words">{row.text}</p>
      </div>)}
      {loaded && <form onSubmit={event => {event.preventDefault(); void send();}}>
        <label className="block">{es ? "Mensaje para Junkerz" : "Message to Junkerz"}
          <textarea className="block w-full rounded-lg border p-2" disabled={busy} maxLength={4000} value={draft}
            onChange={event => {setDraft(event.target.value); nonce.current = ""; setNotice("");}}/>
        </label>
        <button className="min-h-11 font-semibold underline disabled:opacity-50" disabled={busy || !draft.trim()}>{es ? "Enviar a Junkerz" : "Send to Junkerz"}</button>
      </form>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </>}
  </section>;
}
