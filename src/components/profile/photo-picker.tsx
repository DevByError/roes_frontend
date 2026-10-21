"use client";

import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MayorAvatar } from "@/components/domain/person";
import { cropToDataUrl } from "@/lib/image";
import { useApp } from "@/store/app-store";

export function MayorPhotoPicker() {
  const photo = useApp((s) => s.mayor.photo);
  const setPhoto = useApp((s) => s.setMayorPhoto);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return void toast.error("Please choose an image file");
    if (file.size > 12 * 1024 * 1024) return void toast.error("That image is larger than 12 MB");
    setBusy(true);
    try {
      if (await setPhoto(await cropToDataUrl(file, 360, 360))) toast.success("Profile photo updated");
    } catch {
      toast.error("Could not load that image");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="relative shrink-0">
      <MayorAvatar size={96} className="ring-4 ring-white/25" />
      <input ref={input} type="file" accept="image/*" className="sr-only" aria-label="Upload profile photo" onChange={(e) => pick(e.target.files?.[0])} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        aria-label="Change profile photo"
        className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full bg-accent text-accent-foreground shadow-lg ring-2 ring-(--hero-edge) transition hover:scale-105 disabled:opacity-60"
      >
        <Camera className="size-4" />
      </button>
      {photo && (
        <button
          type="button"
          onClick={() => setPhoto(undefined)}
          aria-label="Remove profile photo"
          className="absolute -left-1 -top-1 grid size-7 place-items-center rounded-full bg-white/90 text-destructive shadow ring-2 ring-(--hero-edge) transition hover:scale-105"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
