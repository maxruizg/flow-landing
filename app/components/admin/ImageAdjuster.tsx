import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";

interface Props {
  open: boolean;
  src: string;
  aspect?: number;
  title?: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => Promise<void> | void;
}

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    area.width,
    area.height,
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.92,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function ImageAdjuster({
  open,
  src,
  aspect = 3 / 4,
  title = "Adjust Image",
  onCancel,
  onConfirm,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setArea(null);
      setError(null);
    }
  }, [open, src]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setArea(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!area) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await cropToBlob(src, area);
      await onConfirm(blob);
    } catch (err: any) {
      setError(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-3 py-6 sm:px-6">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={() => !saving && onCancel()}
      />
      <div className="relative bg-flow-900 border border-flow-800/60 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-flow-800/60">
          <div>
            <h3 className="text-white font-display font-semibold text-sm sm:text-base">{title}</h3>
            <p className="text-[11px] text-flow-500">Drag to pan · scroll or slider to zoom</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="text-flow-400 hover:text-white p-1.5 rounded-lg hover:bg-flow-800 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative bg-flow-950 flex-1 min-h-[50vh] sm:min-h-[60vh]">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            restrictPosition={false}
            zoomSpeed={0.5}
            minZoom={0.5}
            maxZoom={4}
          />
        </div>

        <div className="px-4 sm:px-5 py-3 border-t border-flow-800/60 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-flow-500 uppercase tracking-wide w-10">Zoom</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-accent-500"
              disabled={saving}
            />
            <span className="text-[11px] text-flow-400 w-10 text-right tabular-nums">
              {zoom.toFixed(2)}x
            </span>
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
              }}
              disabled={saving}
              className="px-3 py-2 border border-flow-700 text-flow-300 rounded-lg text-xs font-medium hover:bg-flow-800 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 border border-flow-700 text-flow-300 rounded-lg text-xs font-medium hover:bg-flow-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={saving || !area}
              className="px-5 py-2 bg-white text-flow-black rounded-lg text-xs font-semibold hover:bg-flow-200 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
