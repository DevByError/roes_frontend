"use client";

import { Select, SelectContent, SelectGroup, SelectGroupLabel, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/store/app-store";

export const NO_PLACE = "none";

export function PlaceSelect({
  value,
  onChange,
  allowNone,
  placeholder = "Choose a place",
  id,
  invalid,
  currentAdminId,
}: {
  value: string;
  onChange: (v: string) => void;
  allowNone?: boolean;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  currentAdminId?: string;
}) {
  const places = useApp((s) => s.places);
  const admins = useApp((s) => s.admins);
  const adminName = (adminId: string | null) => admins.find((a) => a.id === adminId)?.name;

  const label = (p: (typeof places)[number]) => {
    if (!p.adminId) return `${p.name} · vacant`;
    if (p.adminId === currentAdminId) return `${p.name} · current`;
    return `${p.name} · ${adminName(p.adminId)}`;
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-invalid={invalid}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NO_PLACE}>Assign later</SelectItem>}
        <SelectGroup>
          <SelectGroupLabel>Residential</SelectGroupLabel>
          {places.filter((p) => p.kind === "residential").map((p) => (
            <SelectItem key={p.id} value={p.id}>{label(p)}</SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectGroupLabel>Non-residential</SelectGroupLabel>
          {places.filter((p) => p.kind === "non-residential").map((p) => (
            <SelectItem key={p.id} value={p.id}>{label(p)}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function ReplaceWarning({ placeId, adminId }: { placeId: string; adminId?: string }) {
  const places = useApp((s) => s.places);
  const admins = useApp((s) => s.admins);
  if (!placeId || placeId === NO_PLACE) return null;
  const place = places.find((p) => p.id === placeId);
  const existing = admins.find((a) => a.id === place?.adminId);
  if (!place || !existing || existing.id === adminId) return null;
  return (
    <p className="mt-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
      {place.name} already has <strong>{existing.name}</strong>. They will become unassigned if you continue.
    </p>
  );
}
