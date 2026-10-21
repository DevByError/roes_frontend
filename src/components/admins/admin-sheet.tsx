"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Building2, CalendarClock, MapPin, Snowflake, ShieldCheck, Sun, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, SheetContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { AdminStatusBadge, KindBadge } from "@/components/domain/badges";
import { DetailRow, ReadOnlyNotice } from "@/components/domain/read-only";
import { NO_PLACE, PlaceSelect, ReplaceWarning } from "./place-select";
import { fmtDate, maskId, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export function FreezeDialog({ adminId, open, onOpenChange }: { adminId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const admin = useApp((s) => s.admins.find((a) => a.id === adminId));
  const setFrozen = useApp((s) => s.setAdminFrozen);
  const [reason, setReason] = useState("");
  if (!admin) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Freeze ${admin.name}?`} description="They will be signed out and unable to manage their place until you reactivate the account.">
        <DialogBody>
          <Field label="Reason (shown to the admin)" htmlFor="freeze-reason">
            <Textarea id="freeze-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Under review after resident complaints" />
          </Field>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!(await setFrozen(admin.id, true, reason.trim() || undefined))) return;
              toast(`${admin.name} was frozen`, { description: "You can reactivate the account at any time." });
              setReason("");
              onOpenChange(false);
            }}
          >
            <Snowflake /> Freeze account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminSheet({ adminId, onClose }: { adminId: string | null; onClose: () => void }) {
  const admin = useApp((s) => s.admins.find((a) => a.id === adminId));
  const places = useApp((s) => s.places);
  const users = useApp((s) => s.users);
  const assign = useApp((s) => s.assignAdminPlace);
  const setFrozen = useApp((s) => s.setAdminFrozen);
  const [draft, setDraft] = useState<string | null>(null);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const placeId = draft ?? admin?.placeId ?? NO_PLACE;
  const setPlaceId = (v: string) => setDraft(v);
  const close = () => {
    setDraft(null);
    onClose();
  };

  const place = places.find((p) => p.id === admin?.placeId);
  const residents = place ? users.filter((u) => u.placeId === place.id).length : 0;
  const dirty = draft !== null && draft !== (admin?.placeId ?? NO_PLACE);

  return (
    <Dialog open={!!adminId} onOpenChange={(o) => !o && close()}>
      <SheetContent title={admin ? `Admin ${admin.name}` : "Admin"} className="max-w-lg">
        {admin && (
          <>
            <div className="border-b bg-gradient-to-b from-primary-soft to-transparent px-6 pb-5 pt-8">
              <div className="flex items-center gap-4">
                <Avatar name={admin.name} size={64} />
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-bold tracking-tight">{admin.name}</h2>
                  <p className="truncate text-sm text-muted-foreground">{admin.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AdminStatusBadge status={admin.status} />
                    {admin.promotedFromUserId && <span className="text-xs text-muted-foreground">Promoted from user</span>}
                  </div>
                </div>
              </div>
              {admin.status === "frozen" && (
                <div className="mt-4 rounded-xl bg-info-soft p-3 text-[13px] text-info">
                  <p className="font-semibold">Frozen {admin.frozenAt ? timeAgo(admin.frozenAt) : ""}</p>
                  <p className="mt-0.5">{admin.frozenReason}</p>
                </div>
              )}
            </div>

            <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <section aria-labelledby="assign-h">
                <h3 id="assign-h" className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="size-4 text-primary" /> Assigned place
                </h3>
                {place ? (
                  <div className="mb-3 flex items-start gap-3 rounded-xl border p-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary"><Building2 className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{place.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{place.category} · {place.district}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <KindBadge kind={place.kind} />
                        {place.kind === "residential" && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" /> {residents} residents</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mb-3 rounded-xl bg-warning-soft p-3 text-[13px] text-warning-ink">This admin has no place yet. Assign one so they can start managing it.</p>
                )}
                <Field label="Change place" htmlFor="sheet-place">
                  <PlaceSelect id="sheet-place" value={placeId} onChange={setPlaceId} allowNone currentAdminId={admin.id} />
                  <ReplaceWarning placeId={placeId} adminId={admin.id} />
                </Field>
                <div className="mt-3 flex justify-end gap-2">
                  {dirty && <Button variant="ghost" size="sm" onClick={() => setDraft(null)}>Reset</Button>}
                  <Button
                    size="sm"
                    disabled={!dirty}
                    onClick={async () => {
                      if (!(await assign(admin.id, placeId === NO_PLACE ? null : placeId))) return;
                      setDraft(null);
                      toast.success("Assignment updated", { description: placeId === NO_PLACE ? `${admin.name} is now unassigned.` : `${admin.name} now manages ${places.find((p) => p.id === placeId)?.name}.` });
                    }}
                  >
                    Save assignment
                  </Button>
                </div>
              </section>

              <section aria-labelledby="acct-h">
                <h3 id="acct-h" className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="size-4 text-primary" /> Account access
                </h3>
                {admin.status === "active" ? (
                  <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
                    <p className="text-[13px] text-muted-foreground">Freezing blocks sign-in immediately. Data is kept.</p>
                    <Button variant="destructive-soft" size="sm" onClick={() => setFreezeOpen(true)}><Snowflake /> Freeze</Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
                    <p className="text-[13px] text-muted-foreground">This account is frozen and cannot sign in.</p>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (await setFrozen(admin.id, false)) toast.success(`${admin.name} was reactivated`);
                      }}
                    >
                      <Sun /> Reactivate
                    </Button>
                  </div>
                )}
              </section>

              <section aria-labelledby="pd-h">
                <h3 id="pd-h" className="mb-3 text-sm font-semibold">Personal details</h3>
                <ReadOnlyNotice>Only the admin can change their personal details. You can manage their role, place and access.</ReadOnlyNotice>
                <dl className="mt-2 divide-y">
                  <DetailRow label="Full name" value={admin.name} locked />
                  <DetailRow label="Email" value={admin.email} locked />
                  <DetailRow label="Phone" value={admin.phone} locked />
                  <DetailRow label="National ID" value={maskId(admin.nationalId)} locked mono />
                  <DetailRow label="Gender" value={admin.gender} locked />
                  <DetailRow label="Admin since" value={fmtDate(admin.createdAt)} />
                  <DetailRow label="Last active" value={<span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5 text-muted-foreground" />{timeAgo(admin.lastActiveAt)}</span>} />
                </dl>
              </section>
            </div>
            <FreezeDialog adminId={admin.id} open={freezeOpen} onOpenChange={setFreezeOpen} />
          </>
        )}
      </SheetContent>
    </Dialog>
  );
}
