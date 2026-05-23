"use client";

// ScreenshotEditor — minimal viewport-screenshot annotation overlay.
// Receives a raw PNG data URL from FeedbackBubble's html2canvas capture,
// lets the user crop + draw simple ink strokes, and returns the final
// data URL via onDone. Capped at 1600px longest side so the POST body
// stays under the route's ~6MB cap.
//
// Deliberately small: M2 polish only. No layers, no shapes — just freehand
// pen + rectangular crop.

import { useEffect, useRef, useState } from "react";
import { Check, X, Pencil, Crop, Trash2 } from "lucide-react";

const MAX_DIM = 1600;
const STROKE_COLOR = "#0E2954"; // dp-navy
const STROKE_WIDTH = 4;

export interface ScreenshotEditorProps {
  source: string;
  onCancel: () => void;
  onDone: (finalDataUrl: string) => void;
}

type Stroke = { x: number; y: number }[];

export function ScreenshotEditor({
  source,
  onCancel,
  onDone,
}: ScreenshotEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [tool, setTool] = useState<"pen" | "crop">("pen");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [crop, setCrop] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [exporting, setExporting] = useState(false);

  // Track natural image dimensions for canvas math.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
    };
    img.src = source;
  }, [source]);

  // Redraw overlay (strokes + crop guides) whenever state changes.
  useEffect(() => {
    const canvas = overlayRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !naturalSize) return;
    const rect = img.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render strokes (in display-space coordinates).
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = STROKE_WIDTH;
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
    if (currentStroke && currentStroke.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      for (let i = 1; i < currentStroke.length; i++) {
        ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
      }
      ctx.stroke();
    }

    // Crop rectangle overlay (dim outside, outline rect).
    if (crop) {
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
      ctx.strokeStyle = "#FAF9F6";
      ctx.lineWidth = 2;
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    }
  }, [strokes, currentStroke, crop, naturalSize]);

  function localXY(e: React.PointerEvent): { x: number; y: number } {
    const canvas = overlayRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const p = localXY(e);
    if (tool === "pen") {
      setCurrentStroke([p]);
    } else {
      setDragStart(p);
      setCrop({ x: p.x, y: p.y, w: 0, h: 0 });
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    const p = localXY(e);
    if (tool === "pen" && currentStroke) {
      setCurrentStroke([...currentStroke, p]);
    } else if (tool === "crop" && dragStart) {
      setCrop({
        x: Math.min(dragStart.x, p.x),
        y: Math.min(dragStart.y, p.y),
        w: Math.abs(p.x - dragStart.x),
        h: Math.abs(p.y - dragStart.y),
      });
    }
  }
  function onPointerUp() {
    if (tool === "pen" && currentStroke && currentStroke.length >= 2) {
      setStrokes([...strokes, currentStroke]);
    }
    setCurrentStroke(null);
    setDragStart(null);
  }

  async function handleExport() {
    if (!naturalSize) return;
    const img = imgRef.current;
    if (!img) return;
    setExporting(true);
    try {
      const rect = img.getBoundingClientRect();
      const displayToNaturalX = naturalSize.w / rect.width;
      const displayToNaturalY = naturalSize.h / rect.height;

      // Source crop in NATURAL pixel space.
      const sx = crop ? crop.x * displayToNaturalX : 0;
      const sy = crop ? crop.y * displayToNaturalY : 0;
      const sw = crop ? crop.w * displayToNaturalX : naturalSize.w;
      const sh = crop ? crop.h * displayToNaturalY : naturalSize.h;

      // Output size — scale down to MAX_DIM longest side.
      const longest = Math.max(sw, sh);
      const scale = longest > MAX_DIM ? MAX_DIM / longest : 1;
      const outW = Math.round(sw * scale);
      const outH = Math.round(sh * scale);

      const out = document.createElement("canvas");
      out.width = outW;
      out.height = outH;
      const ctx = out.getContext("2d");
      if (!ctx) {
        setExporting(false);
        return;
      }

      // Draw source slice.
      const srcImg = new Image();
      await new Promise<void>((resolve, reject) => {
        srcImg.onload = () => resolve();
        srcImg.onerror = reject;
        srcImg.src = source;
      });
      ctx.drawImage(srcImg, sx, sy, sw, sh, 0, 0, outW, outH);

      // Overlay strokes — recompute in OUTPUT space.
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = STROKE_COLOR;
      ctx.lineWidth = STROKE_WIDTH * scale * displayToNaturalX;
      for (const stroke of strokes) {
        if (stroke.length < 2) continue;
        ctx.beginPath();
        const transform = (p: { x: number; y: number }) => ({
          x: (p.x * displayToNaturalX - sx) * scale,
          y: (p.y * displayToNaturalY - sy) * scale,
        });
        const first = transform(stroke[0]);
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < stroke.length; i++) {
          const pt = transform(stroke[i]);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      onDone(out.toDataURL("image/png"));
    } finally {
      setExporting(false);
    }
  }

  function handleClearAll() {
    setStrokes([]);
    setCurrentStroke(null);
    setCrop(null);
    setDragStart(null);
  }

  return (
    <div className="fixed inset-0 z-[1500] bg-black/80 flex flex-col">
      {/* Top toolbar */}
      <div className="px-4 py-3 flex items-center justify-between gap-2 bg-card border-b border-border">
        <p className="text-[13px] font-medium text-foreground">
          Markup or crop, then save.
        </p>
        <div className="flex items-center gap-1.5">
          <ToolButton
            active={tool === "pen"}
            onClick={() => setTool("pen")}
            label="Draw"
            Icon={Pencil}
          />
          <ToolButton
            active={tool === "crop"}
            onClick={() => setTool("crop")}
            label="Crop"
            Icon={Crop}
          />
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card hover:bg-muted text-foreground text-[11px] font-medium px-2.5 py-1.5 transition"
          >
            <Trash2 className="size-3" aria-hidden="true" />
            Clear
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={source}
            alt="Screenshot being annotated"
            className="max-h-[70vh] max-w-full block rounded-lg border border-border"
            draggable={false}
          />
          <canvas
            ref={overlayRef}
            className="absolute inset-0"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            style={{
              cursor: tool === "pen" ? "crosshair" : "crosshair",
              touchAction: "none",
            }}
          />
        </div>
      </div>

      {/* Bottom action row */}
      <div className="px-4 py-3 flex items-center justify-end gap-2 bg-card border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] text-muted-foreground hover:text-foreground px-3 py-2 transition inline-flex items-center gap-1"
        >
          <X className="size-3" aria-hidden="true" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 bg-dp-navy text-white rounded-full px-4 py-2 text-[13px] font-medium hover:bg-dp-navy/90 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          <Check className="size-3" aria-hidden="true" />
          {exporting ? "Saving…" : "Use screenshot"}
        </button>
      </div>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon: typeof Pencil;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1 rounded-full border text-[11px] font-medium px-2.5 py-1.5 transition " +
        (active
          ? "bg-dp-navy text-white border-dp-navy"
          : "bg-card border-border text-foreground hover:border-dp-navy")
      }
      aria-pressed={active}
    >
      <Icon className="size-3" aria-hidden="true" />
      {label}
    </button>
  );
}
