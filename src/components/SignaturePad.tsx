import { useEffect, useRef, useState } from "react";
import { btnSecondary } from "./ui";

/** Quadro para desenhar a assinatura com o dedo ou mouse. Devolve um PNG em data URL. */
export default function SignaturePad({ onSave }: { onSave: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const c = ref.current!;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = c.getBoundingClientRect();
    c.width = rect.width * ratio;
    c.height = rect.height * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e: React.PointerEvent) => {
    ref.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    const { x, y } = pos(e);
    const ctx = ref.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.01, y + 0.01);
    ctx.stroke();
    setDirty(true);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    const { x, y } = pos(e);
    const ctx = ref.current!.getContext("2d")!;
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  const up = () => {
    drawing.current = false;
  };

  const clear = () => {
    const c = ref.current!;
    c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    setDirty(false);
  };

  return (
    <div className="space-y-3">
      <canvas
        ref={ref}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        className="h-40 w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"
        aria-label="Área para desenhar a assinatura"
      />
      <div className="flex gap-2">
        <button type="button" className={`${btnSecondary} flex-1`} onClick={clear}>
          Limpar
        </button>
        <button
          type="button"
          disabled={!dirty}
          className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
          onClick={() => onSave(ref.current!.toDataURL("image/png"))}
        >
          Usar esta assinatura
        </button>
      </div>
    </div>
  );
}
