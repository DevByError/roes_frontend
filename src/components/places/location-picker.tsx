"use client";

import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { fromImageXY, MAP_ASPECT, MAP_IMAGE, toImageXY } from "@/lib/map-config";

export function LocationPicker({
  lat,
  lng,
  kind,
  onChange,
  className,
}: {
  lat: number;
  lng: number;
  kind: "residential" | "non-residential";
  onChange: (lat: number, lng: number) => void;
  className?: string;
}) {
  const valid = Number.isFinite(lat) && Number.isFinite(lng);
  const { x, y } = valid ? toImageXY(lat, lng) : { x: -1, y: -1 };
  const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;

  return (
    <div
      role="application"
      aria-label="City map – click to choose the location"
      className={cn("relative w-full cursor-crosshair select-none overflow-hidden rounded-xl border bg-(--map-bg)", className)}
      style={{ aspectRatio: MAP_ASPECT }}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const p = fromImageXY((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
        onChange(Number(p.lat.toFixed(5)), Number(p.lng.toFixed(5)));
      }}
    >
      <img src={MAP_IMAGE} alt="" draggable={false} className="roes-map-img pointer-events-none size-full object-fill" />
      {inside && (
        <span
          className={cn(
            "pointer-events-none absolute grid size-8 -translate-x-1/2 -translate-y-full place-items-center drop-shadow-lg",
            kind === "residential" ? "text-primary" : "text-accent",
          )}
          style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
        >
          <MapPin className="size-8 fill-current stroke-white" strokeWidth={1.5} />
        </span>
      )}
      <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-md bg-card/90 px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm">
        Click the map to place the pin
      </span>
    </div>
  );
}
