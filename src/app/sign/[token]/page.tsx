"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ||
                 "https://api.dankdash.ai";

type Preview = {
  pickup_order_id: number;
  buyer_name: string;
  buyer_address?: string;
  vehicle: { year: number; make: string; model: string;
             vin: string; condition?: string; title_status?: string };
  sale_price_cents: number;
  expires_at?: string;
};

export default function SellerSignPage() {
  const params = useParams();
  const token = String(params.token);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/junkerz/seller/sign/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(setPreview)
      .catch(e => setError(String(e)));
  }, [token]);

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    drawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    const point = "touches" in e
      ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      : { x: e.clientX - r.left, y: e.clientY - r.top };
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const r = canvas.getBoundingClientRect();
    const point = "touches" in e
      ? { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }
      : { x: e.clientX - r.left, y: e.clientY - r.top };
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDraw = () => { drawingRef.current = false; };

  const submit = async () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const r = await fetch(
      `${API_BASE}/api/junkerz/seller/sign/${token}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature_data_url: dataUrl }),
      }
    );
    if (r.ok) setSubmitted(true);
    else setError(`Submit failed: ${r.status}`);
  };

  if (error) return <main className="p-12 text-red-600">{error}</main>;
  if (submitted) return (
    <main className="p-12 text-center">
      <h1 className="text-2xl font-bold mb-3">Thank you!</h1>
      <p>Your signature has been recorded. The Bill of Sale has been emailed to you.</p>
    </main>
  );
  if (!preview) return <main className="p-12">Loading…</main>;

  const price = (preview.sale_price_cents / 100).toFixed(2);
  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign your Bill of Sale</h1>
      <div className="bg-white rounded shadow p-6 space-y-3">
        <p><b>Buyer:</b> {preview.buyer_name}</p>
        {preview.buyer_address && (
          <p><b>Buyer address:</b> {preview.buyer_address}</p>
        )}
        <p><b>Vehicle:</b> {preview.vehicle.year} {preview.vehicle.make} {preview.vehicle.model}</p>
        <p><b>VIN:</b> {preview.vehicle.vin}</p>
        <p><b>Sale price:</b> ${price}</p>
        <p className="text-sm text-slate-600">Sign below to confirm.</p>
        <canvas ref={canvasRef} width={520} height={180}
                className="border bg-slate-50 w-full touch-none"
                onMouseDown={startDraw} onMouseMove={draw}
                onMouseUp={stopDraw} onMouseLeave={stopDraw}
                onTouchStart={startDraw} onTouchMove={draw}
                onTouchEnd={stopDraw} />
        <Button className="w-full" onClick={submit}>I confirm and sign</Button>
      </div>
    </main>
  );
}
