"use client";
import { useEffect, useState } from "react";
import YardDirectMessages from "@/components/buyers/YardDirectMessages";
import Link from "next/link";
import { SupplierReplyPanel } from "@/components/YardTokenViews";
import YardRequestConversation from "@/components/YardRequestConversation";
import { buyerApi } from "@/lib/buyer-api";
import { useBuyerLang } from "@/lib/buyer-lang";

type PartRequest = {
  id: string; reference: string; component: string; vehicle_label: string; status: string;
  supplier_price_cents: number | null; match_id: number | null;
  latest_message: {text: string; actor_role: string} | null;
};

export default function PartsRequests() {
  const [lang] = useBuyerLang();
  const es = lang === "es";
  const [rows, setRows] = useState<PartRequest[]>([]);
  const [match, setMatch] = useState("");
  const [selected, setSelected] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  useEffect(() => {
    let active = true;
    const query = new URLSearchParams(window.location.search);
    setSelected(query.get("request") || "");
    setMatch(query.get("match") || "");
    buyerApi.partsRequests().then(data => {
      if (active) { setRows(data.requests); setState("ready"); }
    }).catch(() => { if (active) setState("failed"); });
    return () => { active = false; };
  }, []);
  const [refreshRevision, setRefreshRevision] = useState(0);
  const refreshAfterReply = () => {
    setRefreshRevision(value => value + 1);
    buyerApi.partsRequests().then(data => setRows(data.requests)).catch(() => setState("failed"));
  };
  const currency = (cents: number) => new Intl.NumberFormat(es ? "es-US" : "en-US", {style:"currency", currency:"USD"}).format(cents / 100);
  const visibleRows = match ? rows.filter(row => String(row.match_id) === match) : rows;
  return <main className="mx-auto max-w-3xl space-y-4 p-5">
    <h1 className="text-2xl font-bold">{es ? "Solicitudes de piezas" : "Parts requests"}</h1>
    {state === "loading" && <p>{es ? "Cargando…" : "Loading requests…"}</p>}
    {state === "failed" && <p role="alert">{es ? "No se pudieron cargar las solicitudes." : "Could not load parts requests."} <button className="underline" onClick={() => window.location.reload()}>{es ? "Reintentar" : "Retry"}</button></p>}
    {match && <a href="/buyers/parts-requests" className="underline">{es ? "Ver todas las solicitudes" : "View all parts requests"}</a>}
    {state === "ready" && !visibleRows.length && <p>{es ? "No hay solicitudes asignadas a su patio." : "No parts requests assigned to your yard."}</p>}
    {selected && state === "ready" && !rows.some(r => r.id === selected) && <p role="alert">{es ? "Solicitud no disponible." : "This request is unavailable."}</p>}
    {visibleRows.map(row => <article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">{row.vehicle_label} · {row.component}</h2>
      <p className="text-sm text-slate-600">{row.reference} · {row.status.replace(/_/g," ")}</p>
      {row.supplier_price_cents !== null && <p>{es ? "Precio del patio" : "Yard price"} · {currency(row.supplier_price_cents)}</p>}
      {row.status === "awaiting_yard" && <p>{es ? "Junkerz espera su respuesta." : "Junkerz is waiting for your yard’s response."}</p>}
      {["available", "ready_for_pickup", "not_available", "need_details"].includes(row.status) && <p>{es ? "Junkerz revisará la respuesta de su patio." : "Junkerz will review your yard’s reply."}</p>}
      {!["awaiting_yard", "available", "ready_for_pickup", "not_available", "need_details"].includes(row.status) && <p>{es ? "No se requiere una respuesta de su patio." : "No yard reply required."}</p>}
      {row.latest_message && <p className="mt-2 truncate">{row.latest_message.actor_role === "staff" ? "Junkerz" : es ? "Su patio" : "Your yard"} · {row.latest_message.text || (es ? "Foto" : "Photo")}</p>}
      {row.match_id && <Link className="mr-4 underline" href={`/buyers/won-cars/${row.match_id}`}>{es ? "Ver vehículo ganado" : "View won car"}</Link>}
      <button aria-expanded={selected === row.id} className="min-h-11 font-semibold text-brand-700 underline" onClick={() => {
        const next = selected === row.id ? "" : row.id;
        setSelected(next);
        setMatch("");
        window.history.replaceState(null,"",next ? `?request=${next}` : "/buyers/parts-requests");
      }}>{selected === row.id ? (es ? "Cerrar" : "Close request") : (es ? "Abrir" : "Open request")}</button>
      {selected === row.id && <div>
        {!["staff_review", "received", "cancelled"].includes(row.status) && <SupplierReplyPanel
          key={row.id} requestId={row.id} loadSupplier={buyerApi.partReplyView} reply={buyerApi.sendPartReply}
          loadPrices={buyerApi.partMarketPrices} onSaved={refreshAfterReply}
        />}
        <YardRequestConversation requestId={row.id} refreshRevision={refreshRevision} audience="supplier"/>
      </div>}
    </article>)}
    <YardDirectMessages es={es}/>
  </main>;
}
