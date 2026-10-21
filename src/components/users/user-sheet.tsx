"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, CalendarClock, FileWarning, ShieldCheck, UserCog } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { UserStatusBadge } from "@/components/domain/badges";
import { DetailRow, ReadOnlyNotice } from "@/components/domain/read-only";
import { NO_PLACE, PlaceSelect, ReplaceWarning } from "@/components/admins/place-select";
import { fmtDate, maskId, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export function UserSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const user = useApp((s) => s.users.find((u) => u.id === userId));
  const place = useApp((s) => s.places.find((p) => p.id === user?.placeId));
  const promote = useApp((s) => s.promoteUser);
  const [placeId, setPlaceId] = useState(NO_PLACE);
  const close = () => {
    setPlaceId(NO_PLACE);
    onClose();
  };

  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && close()}>
      <SheetContent title={user ? `User ${user.name}` : "User"} className="max-w-lg">
        {user && (
          <>
            <div className="border-b bg-gradient-to-b from-primary-soft to-transparent px-6 pb-5 pt-8">
              <div className="flex items-center gap-4">
                <Avatar name={user.name} size={64} />
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold tracking-tight">{user.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <UserStatusBadge status={user.status} />
                    {user.role === "admin" && <Badge tone="primary"><ShieldCheck /> Admin</Badge>}
                  </div>
                </div>
              </div>
            </div>

            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Building2 className="size-4 text-primary" /> Residence</h3>
                <div className="rounded-xl border p-3">
                  <p className="text-sm font-semibold">{place?.name}</p>
                  <p className="text-xs text-muted-foreground">{place?.category} · {place?.district}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Unit <span className="font-mono text-foreground">{user.unit}</span></p>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted p-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="size-3.5" /> Joined</p>
                  <p className="mt-1 text-sm font-semibold">{fmtDate(user.joinedAt)}</p>
                </div>
                <div className="rounded-xl bg-muted p-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><FileWarning className="size-3.5" /> Reports posted</p>
                  <p className="tabular mt-1 text-sm font-semibold">{user.reportsCount}</p>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold">Personal details</h3>
                <ReadOnlyNotice>Personal details belong to the resident. You can view them but not edit them.</ReadOnlyNotice>
                <dl className="mt-2 divide-y">
                  <DetailRow label="Full name" value={user.name} locked />
                  <DetailRow label="Email" value={user.email} locked />
                  <DetailRow label="Phone" value={user.phone} locked />
                  <DetailRow label="National ID" value={maskId(user.nationalId)} locked mono />
                  <DetailRow label="Gender" value={user.gender} locked />
                  <DetailRow label="Last active" value={timeAgo(user.lastActiveAt)} />
                </dl>
              </section>

              {user.role === "user" && user.status === "verified" && (
                <section>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserCog className="size-4 text-primary" /> Give admin role</h3>
                  <Field label="Place to manage" htmlFor="u-promote-place">
                    <PlaceSelect id="u-promote-place" value={placeId} onChange={setPlaceId} allowNone />
                    <ReplaceWarning placeId={placeId} />
                  </Field>
                  <Button
                    className="mt-3 w-full"
                    variant="outline"
                    onClick={async () => {
                      if (await promote(user.id, placeId === NO_PLACE ? null : placeId)) toast.success(`${user.name} is now an admin`);
                    }}
                  >
                    <UserCog /> Promote to admin
                  </Button>
                </section>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Dialog>
  );
}
