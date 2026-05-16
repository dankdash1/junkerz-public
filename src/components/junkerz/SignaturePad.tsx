"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type Props = {
  width?: number;
  height?: number;
  onChange?: (dataUrl: string | null) => void;
  disabled?: boolean;
};

/**
 * Touch + mouse signature canvas. Outputs `data:image/png;base64,...`.
 * Phone-friendly — passive touch handlers wired with preventDefault so
 * the page doesn't scroll while signing.
 */
export default function SignaturePad({
  width = 380,
  height = 160,
  onChange,
  disabled = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const getCtx = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return null;
    return c.getContext("2d");
  }, []);

  const point = useCallback((ev: PointerEvent | TouchEvent) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const rect = c.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ("touches" in ev && ev.touches.length > 0) {
      clientX = ev.touches[0].clientX;
      clientY = ev.touches[0].clientY;
    } else {
      const pe = ev as PointerEvent;
      clientX = pe.clientX;
      clientY = pe.clientY;
    }
    return {
      x: (clientX - rect.left) * (c.width / rect.width),
      y: (clientY - rect.top) * (c.height / rect.height),
    };
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    // White background so PNG is opaque
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const start = (ev: PointerEvent | TouchEvent) => {
      if (disabled) return;
      drawing.current = true;
      lastPt.current = point(ev);
      ev.preventDefault();
    };
    const move = (ev: PointerEvent | TouchEvent) => {
      if (!drawing.current || disabled) return;
      const p = point(ev);
      const ctx2 = getCtx();
      if (!ctx2 || !lastPt.current) return;
      ctx2.beginPath();
      ctx2.moveTo(lastPt.current.x, lastPt.current.y);
      ctx2.lineTo(p.x, p.y);
      ctx2.stroke();
      lastPt.current = p;
      setHasInk(true);
      ev.preventDefault();
    };
    const end = () => {
      if (!drawing.current) return;
      drawing.current = false;
      lastPt.current = null;
      if (onChange && canvasRef.current) {
        onChange(canvasRef.current.toDataURL("image/png"));
      }
    };

    c.addEventListener("pointerdown", start);
    c.addEventListener("pointermove", move);
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("touchstart", start, { passive: false });
    c.addEventListener("touchmove", move, { passive: false });
    c.addEventListener("touchend", end);

    return () => {
      c.removeEventListener("pointerdown", start);
      c.removeEventListener("pointermove", move);
      c.removeEventListener("pointerup", end);
      c.removeEventListener("pointercancel", end);
      c.removeEventListener("touchstart", start);
      c.removeEventListener("touchmove", move);
      c.removeEventListener("touchend", end);
    };
  }, [point, getCtx, onChange, disabled]);

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-slate-300 rounded-md w-full touch-none bg-white"
        style={{ touchAction: "none" }}
      />
      <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
        <span>{hasInk ? "Looks good — tap Save when ready." : "Sign with your finger or a stylus."}</span>
        <button onClick={clear} type="button" className="text-slate-600 underline" disabled={disabled || !hasInk}>
          Clear
        </button>
      </div>
    </div>
  );
}
