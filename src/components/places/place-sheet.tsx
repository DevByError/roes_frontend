"use client";

import Link from "next/link";
import { ArrowUpRight, Home, MapPin, Pencil, ScrollText, UserCog, Users, UserX } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HouseRule } from "@/lib/types";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { AdminStatusBadge, KindBadge } from "@/components/domain/badges";
import { PersonCell } from "@/components/domain/person";
import { DetailRow } from "@/components/domain/read-only";
import { fmtDate, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";

function RuleList({ rules, empty }: { rules: HouseRule[]; empty: string }) {
  if (!rules.length) return <p className="rounded-xl border border-dashed p-4 text-center text-[13px] text-muted-foreground">{empty}</p>;
  return (
    <ol className="space-y-2">
      {rules.map((r, i) => (
        <li key={r.id} className="flex gap-3 rounded-xl border bg-card p-3">
          <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug">{r.title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{r.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PlaceSheet({ placeId, onClose, onEdit, onAssign }: { placeId: string | null; onClose: () => void; onEdit?: (id: string) => void; onAssign?: (id: string) => void }) {
  const place = useApp((s) => s.places.find((p) => p.id === placeId));
  const admin = useApp((s) => s.admins.find((a) => a.id === place?.adminId));
  const users = useApp((s) => s.users);
  const residents = place ? users.filter((u) => u.placeId === place.id) : [];

  return (
    <Dialog open={!!placeId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={place ? place.name : "Place"} className="max-w-lg">
        {place && (
          <>
            <div className="border-b bg-gradient-to-b from-primary-soft to-transparent px-6 pb-5 pt-8">
              <KindBadge kind={place.kind} />
              <div className="mt-3 flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold tracking-tight">{place.name}</h2>
                {onEdit && <Button variant="outline" size="sm" className="shrink-0" onClick={() => onEdit(place.id)}><Pencil /> Edit</Button>}
              </div>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" /> {place.address}
              </p>
            </div>

            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <p className="text-sm leading-relaxed text-muted-foreground">{place.description}</p>

              <section className="grid grid-cols-3 gap-3">
                {place.kind === "residential" && (
                  <div className="rounded-xl bg-muted p-3">
                    <Users className="size-4 text-primary" />
                    <p className="tabular mt-2 text-xl font-bold leading-none">{residents.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Users</p>
                  </div>
                )}
                {place.kind === "residential" && (
                  <div className="rounded-xl bg-muted p-3">
                    <Home className="size-4 text-primary" />
                    <p className="tabular mt-2 text-xl font-bold leading-none">{place.houseRules.residents.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Resident rules</p>
                  </div>
                )}
                <div className="rounded-xl bg-muted p-3">
                  <ScrollText className="size-4 text-primary" />
                  <p className="tabular mt-2 text-xl font-bold leading-none">{place.houseRules.visitors.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Visitor rules</p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><ScrollText className="size-4 text-primary" /> House rules</h3>
                {place.kind === "residential" ? (
                  <Tabs defaultValue="residents" key={place.id}>
                    <TabsList>
                      <TabsTrigger value="residents"><Home /> Resident rules ({place.houseRules.residents.length})</TabsTrigger>
                      <TabsTrigger value="visitors"><ScrollText /> Visitor rules ({place.houseRules.visitors.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="residents"><RuleList rules={place.houseRules.residents} empty="No resident rules have been published yet." /></TabsContent>
                    <TabsContent value="visitors"><RuleList rules={place.houseRules.visitors} empty="No visitor rules have been published yet." /></TabsContent>
                  </Tabs>
                ) : (
                  <RuleList rules={place.houseRules.visitors} empty="No visitor rules have been published yet." />
                )}
                <p className="mt-2 text-xs text-muted-foreground">Rules are written and maintained by the place admin. The mayor can read them here.</p>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserCog className="size-4 text-primary" /> Place admin</h3>
                {admin ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
                    <PersonCell name={admin.name} sub={`Active ${timeAgo(admin.lastActiveAt)}`} size={40} />
                    <AdminStatusBadge status={admin.status} />
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed bg-warning-soft p-3 text-[13px] text-warning-ink">
                    <UserX className="size-5 shrink-0" />
                    <p>No admin is assigned to this place yet.</p>
                  </div>
                )}
                {onAssign ? (
                  <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => onAssign(place.id)}>
                    <UserCog /> {admin ? "Change admin" : "Assign an admin"}
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                    <Link href="/admins">Manage admins<ArrowUpRight /></Link>
                  </Button>
                )}
              </section>

              {place.kind === "residential" && (
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Newest residents</h3>
                    <Link href={`/users?place=${place.id}`} className="text-xs font-medium text-primary hover:underline">View all {residents.length}</Link>
                  </div>
                  <ul className="space-y-1">
                    {residents.slice(0, 5).map((u) => (
                      <li key={u.id} className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/60">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={u.name} size={32} />
                          <span className="truncate text-sm">{u.name}</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(u.joinedAt)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="mb-1 text-sm font-semibold">Details</h3>
                <dl className="divide-y">
                  <DetailRow label="Category" value={place.category} />
                  <DetailRow label="District" value={place.district} />
                  <DetailRow label="Coordinates" value={`${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`} mono />
                  <DetailRow label="Registered" value={fmtDate(place.createdAt)} />
                </dl>
                <Button asChild variant="ghost" size="sm" className="mt-2">
                  <a href={`https://www.google.com/maps?q=${place.lat},${place.lng}`} target="_blank" rel="noreferrer">
                    Open in maps <ArrowUpRight />
                  </a>
                </Button>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Dialog>
  );
}
