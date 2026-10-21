"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Building2, CheckCircle2, Eye, MapPin, MoreHorizontal, Pencil, Plus, Search, Trash2, UserCog, UserPlus, UserX, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/label";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KindBadge } from "@/components/domain/badges";
import { PersonCell } from "@/components/domain/person";
import { useApp } from "@/store/app-store";
import type { Place } from "@/lib/types";

export type ManageFilter = "all" | "residential" | "non-residential" | "unassigned";

export function AssignDialog({ place, onClose, onNewAdmin }: { place: Place | null; onClose: () => void; onNewAdmin: () => void }) {
  const admins = useApp((s) => s.admins);
  const places = useApp((s) => s.places);
  const assign = useApp((s) => s.assignAdminPlace);
  const [adminId, setAdminId] = useState<string>(() => admins.find((a) => !a.placeId && a.status === "active")?.id ?? "");
  const chosen = admins.find((a) => a.id === adminId);
  const chosenPlace = places.find((p) => p.id === chosen?.placeId);
  const current = admins.find((a) => a.id === place?.adminId);

  const sorted = [...admins].sort((a, b) => Number(!!a.placeId) - Number(!!b.placeId) || a.name.localeCompare(b.name));

  return (
    <Dialog open={!!place} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Assign an admin" description={place ? `Choose who manages ${place.name}.` : undefined} className="sm:max-w-md">
        <DialogBody className="space-y-4">
          <Field label="Admin" htmlFor="assign-admin">
            <Select value={adminId} onValueChange={setAdminId}>
              <SelectTrigger id="assign-admin"><SelectValue placeholder="Choose an admin" /></SelectTrigger>
              <SelectContent>
                {sorted.map((a) => {
                  const pl = places.find((p) => p.id === a.placeId);
                  return (
                    <SelectItem key={a.id} value={a.id} disabled={a.status === "frozen"}>
                      {a.name} · {a.status === "frozen" ? "frozen" : pl ? pl.name : "no place yet"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </Field>
          {chosenPlace && chosenPlace.id !== place?.id && (
            <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
              {chosen?.name} currently manages <strong>{chosenPlace.name}</strong>. That place will become vacant if you continue.
            </p>
          )}
          {current && current.id !== adminId && (
            <p className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning-ink">
              {place?.name} already has <strong>{current.name}</strong>. They will become unassigned.
            </p>
          )}
          <button type="button" onClick={() => { onClose(); onNewAdmin(); }} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <UserPlus className="size-3.5" /> Or create a new admin account
          </button>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button
            disabled={!adminId}
            onClick={async () => {
              if (!place || !chosen) return;
              if (!(await assign(chosen.id, place.id))) return;
              toast.success(`${chosen.name} now manages ${place.name}`);
              onClose();
            }}
          >
            Assign admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RemoveDialog({ place, onClose }: { place: Place | null; onClose: () => void }) {
  const remove = useApp((s) => s.removePlace);
  const admins = useApp((s) => s.admins);
  const admin = admins.find((a) => a.id === place?.adminId);
  return (
    <Dialog open={!!place} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title="Remove this place?" description={place ? `${place.name} will be removed from the city.` : undefined} className="sm:max-w-md">
        <DialogBody>
          <p className="text-sm text-muted-foreground">
            This cannot be undone.{admin ? <> <strong className="text-foreground">{admin.name}</strong> will become an unassigned admin.</> : null}
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!place) return;
              if (!(await remove(place.id))) return;
              toast.success(`${place.name} was removed`);
              onClose();
            }}
          >
            <Trash2 /> Remove place
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManagePlaces({
  initialFilter = "all",
  onOpen,
  onEdit,
  onAdd,
  onNewAdmin,
}: {
  initialFilter?: ManageFilter;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  onNewAdmin: () => void;
}) {
  const places = useApp((s) => s.places);
  const admins = useApp((s) => s.admins);
  const users = useApp((s) => s.users);
  const [filter, setFilter] = useState<ManageFilter>(initialFilter);
  const [q, setQ] = useState("");
  const [assignId, setAssignId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const residents = useMemo(() => {
    const m = new Map<string, number>();
    users.forEach((u) => m.set(u.placeId, (m.get(u.placeId) ?? 0) + 1));
    return m;
  }, [users]);

  const vacant = places.filter((p) => !p.adminId).length;
  const resCount = places.filter((p) => p.kind === "residential").length;
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return places
      .filter((p) => (filter === "all" ? true : filter === "unassigned" ? !p.adminId : p.kind === filter))
      .filter((p) => !needle || p.name.toLowerCase().includes(needle) || p.district.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle))
      .sort((a, b) => Number(!!a.adminId) - Number(!!b.adminId) || a.name.localeCompare(b.name));
  }, [places, filter, q]);

  const assignPlace = places.find((p) => p.id === assignId) ?? null;
  const removePlace = places.find((p) => p.id === removeId) ?? null;

  return (
    <Card className="overflow-hidden animate-fade-up">
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          label="Filter places"
          options={[
            { value: "all", label: `All ${places.length}` },
            { value: "residential", label: `Residential ${resCount}` },
            { value: "non-residential", label: `Non-residential ${places.length - resCount}` },
            { value: "unassigned", label: `Unassigned ${vacant}` },
          ]}
        />
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search place, district or category" className="pl-9" aria-label="Search places" />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={filter === "unassigned" ? <CheckCircle2 /> : <Building2 />}
          title={filter === "unassigned" ? "Every place has an admin" : "No places found"}
          description={filter === "unassigned" ? "Nothing is waiting for an admin right now." : "Try a different filter, or add a new place."}
          action={filter === "unassigned" ? undefined : <Button onClick={onAdd}><Plus /> Add place</Button>}
        />
      ) : (
        <ul className="divide-y">
          {rows.map((p) => {
            const admin = admins.find((a) => a.id === p.adminId);
            const count = residents.get(p.id) ?? 0;
            const canRemove = count === 0;
            return (
              <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => onOpen(p.id)} className="flex min-w-0 items-start gap-3 text-left">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${p.kind === "residential" ? "bg-primary-soft text-primary" : "bg-accent-soft text-warning-ink"}`}><Building2 className="size-5" /></span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold">{p.name}</span>
                      <KindBadge kind={p.kind} />
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {p.district} · {p.category}</span>
                      {p.kind === "residential" && <span className="inline-flex items-center gap-1"><Users className="size-3" /> {count} residents</span>}
                    </span>
                  </span>
                </button>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  {admin ? <PersonCell name={admin.name} sub="Place admin" size={34} /> : <Badge tone="warning"><UserX /> Unassigned</Badge>}
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant={admin ? "outline" : "default"} onClick={() => setAssignId(p.id)}>
                      <UserCog /> {admin ? "Change" : "Assign admin"}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`}><MoreHorizontal /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onOpen(p.id)}><Eye /> View details & rules</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onEdit(p.id)}><Pencil /> Edit place</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive disabled={!canRemove} onSelect={() => canRemove && setRemoveId(p.id)}>
                          <Trash2 /> {canRemove ? "Remove place" : `Has ${count} residents`}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AssignDialog key={assignId ?? "none"} place={assignPlace} onClose={() => setAssignId(null)} onNewAdmin={onNewAdmin} />
      <RemoveDialog place={removePlace} onClose={() => setRemoveId(null)} />
    </Card>
  );
}
