"use client";

import { useRef, useState } from "react";
import { ImagePlus, Replace, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cropToDataUrl } from "@/lib/image";

export const COVER_ASPECT = "aspect-[2/1]";
const COVER_W = 1200;
const COVER_H = 600;

const MAX_BYTES = 12 * 1024 * 1024;

export function ImageField({ value, onChange, id }: { value?: string; onChange: (v: string | undefined) => void; id: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Please choose an image file (JPG, PNG or WebP).");
    if (file.size > MAX_BYTES) return setError("That image is larger than 12 MB. Please pick a smaller one.");
    setBusy(true);
    try {
      onChange(await cropToDataUrl(file, COVER_W, COVER_H));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load that image.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <input id={id} ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border bg-muted">
          <img src={value} alt="Campaign cover preview" className={cn(COVER_ASPECT, "w-full object-cover")} />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
            <Button type="button" size="sm" variant="secondary" onClick={() => input.current?.click()} loading={busy}><Replace /> Replace</Button>
            <Button type="button" size="sm" variant="destructive-soft" onClick={() => onChange(undefined)}><Trash2 /> Remove</Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            pick(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-muted/40 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary-soft hover:text-primary",
            COVER_ASPECT,
            busy && "pointer-events-none opacity-60",
          )}
        >
          <ImagePlus className="size-7" />
          <span className="text-sm font-medium">{busy ? "Processing…" : "Click to add a cover image"}</span>
          <span className="text-xs">or drop a photo here · cropped to 2:1 (1200 × 600)</span>
        </button>
      )}
      {error && <p role="alert" className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
