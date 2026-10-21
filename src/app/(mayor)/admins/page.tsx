"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, ChevronRight, Eye, MapPin, MoreHorizontal, Search, Snowflake, Sun, TriangleAlert, UserCog, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { AdminStatusBadge, KindBadge } from "@/components/domain/badges";
import { PersonCell } from "@/components/domain/person";
import { AdminSheet, FreezeDialog } from "@/components/admins/admin-sheet";
import { CreateAdminDialog } from "@/components/admins/create-admin-dialog";
import { timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";

type Filter = "all" | "active" | "frozen" | "unassigned";

export default function AdminsPage() {
  const admins = useApp((s) => s.admins);
  const places = useApp((s) => s.places);
  const setFrozen = useApp((s) => s.setAdminFrozen);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(() => new URLSearchParams(window.location.search).get("new") === "1");
  const [freezeId, setFreezeId] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("new")) window.history.replaceState(null, "", "/admins");
  }, []);

  const placeOf = (id: string | null) => places.find((p) => p.id === id);
  const counts = {
    all: admins.length,
    active: admins.filter((a) => a.status === "active").length,
    frozen: admins.filter((a) => a.status === "frozen").length,
    unassigned: admins.filter((a) => !a.placeId).length,
  };
  const vacant = places.filter((p) => !p.adminId);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return admins.filter((a) => {
      if (filter === "active" && a.status !== "active") return false;
      if (filter === "frozen" && a.status !== "frozen") return false;
      if (filter === "unassigned" && a.placeId) return false;
      if (!needle) return true;
      const pl = placeOf(a.placeId);
      return a.name.toLowerCase().includes(needle) || a.email.toLowerCase().includes(needle) || (pl?.name.toLowerCase().includes(needle) ?? false);
    });
  }, [admins, places, filter, q]);

  const toggleFreeze = async (id: string, name: string, frozen: boolean) => {
    if (frozen) {
      if (await setFrozen(id, false)) toast.success(`${name} was reactivated`);
    } else {
      setFreezeId(id);
    }
  };

  const ActionMenu = ({ id, name, frozen }: { id: string; name: string; frozen: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`}><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => setOpenId(id)}><Eye /> View details</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setOpenId(id)}><MapPin /> Change place</DropdownMenuItem>
        <DropdownMenuSeparator />
        {frozen ? (
          <DropdownMenuItem onSelect={() => toggleFreeze(id, name, true)}><Sun /> Reactivate</DropdownMenuItem>
        ) : (
          <DropdownMenuItem destructive onSelect={() => toggleFreeze(id, name, false)}><Snowflake /> Freeze…</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Admins"
        description="Create admin accounts, give the admin role to a user, move admins between places and freeze access. Personal details stay read-only."
        actions={<Button onClick={() => setCreateOpen(true)}><UserPlus /> Add admin</Button>}
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Admin summary">
        <StatCard label="Total admins" value={counts.all} icon={<UserCog />} hint={`${places.length - vacant.length} of ${places.length} places covered`} />
        <StatCard label="Active" value={counts.active} icon={<UserCog />} tone="success" hint="can sign in" />
        <StatCard label="Frozen" value={counts.frozen} icon={<Snowflake />} tone="info" hint="access blocked" />
        <StatCard label="Waiting for a place" value={counts.unassigned} icon={<MapPin />} tone="gold" hint={`${vacant.length} vacant place${vacant.length === 1 ? "" : "s"}`} />
      </section>

      {vacant.length > 0 && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4 text-sm text-warning-ink animate-fade-up">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>{vacant.map((p) => p.name).join(" and ")}</strong> {vacant.length === 1 ? "has" : "have"} no admin. Assign an existing admin or add a new one.{" "}
            <Link href="/places?tab=manage&filter=unassigned" className="font-semibold underline underline-offset-2">See unassigned places</Link>
          </p>
        </div>
      )}

      <Card className="mt-4 overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            value={filter}
            onChange={setFilter}
            label="Filter admins"
            options={[
              { value: "all", label: `All ${counts.all}` },
              { value: "active", label: `Active ${counts.active}` },
              { value: "frozen", label: `Frozen ${counts.frozen}` },
              { value: "unassigned", label: `Unassigned ${counts.unassigned}` },
            ]}
          />
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search admin, email or place" className="pl-9" aria-label="Search admins" />
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<UserCog />} title="No admins found" description="Try a different filter or add a new admin." action={<Button onClick={() => setCreateOpen(true)}><UserPlus /> Add admin</Button>} />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Admin</TH>
                    <TH>Place</TH>
                    <TH>Status</TH>
                    <TH>Last active</TH>
                    <TH className="w-12"><span className="sr-only">Actions</span></TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((a) => {
                    const pl = placeOf(a.placeId);
                    return (
                      <TR key={a.id} data-clickable="true" onClick={() => setOpenId(a.id)}>
                        <TD><PersonCell name={a.name} sub={a.email} /></TD>
                        <TD>
                          {pl ? (
                            <div className="flex items-center gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{pl.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{pl.district}</p>
                              </div>
                              <KindBadge kind={pl.kind} />
                            </div>
                          ) : (
                            <span className="text-sm text-warning-ink">Unassigned</span>
                          )}
                        </TD>
                        <TD><AdminStatusBadge status={a.status} /></TD>
                        <TD className="tabular whitespace-nowrap text-muted-foreground">{timeAgo(a.lastActiveAt)}</TD>
                        <TD onClick={(e) => e.stopPropagation()}><ActionMenu id={a.id} name={a.name} frozen={a.status === "frozen"} /></TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </div>

            <ul className="divide-y md:hidden">
              {rows.map((a) => {
                const pl = placeOf(a.placeId);
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => setOpenId(a.id)} className="flex w-full items-center gap-3 p-4 text-left transition-colors active:bg-muted">
                      <PersonCell name={a.name} sub={pl?.name ?? "Unassigned"} className="flex-1" size={42} />
                      <div className="flex flex-col items-end gap-1.5">
                        <AdminStatusBadge status={a.status} />
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="size-3" /> {pl ? pl.district : "—"}
                        </span>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      <AdminSheet adminId={openId} onClose={() => setOpenId(null)} />
      <CreateAdminDialog open={createOpen} onOpenChange={setCreateOpen} />
      {freezeId && <FreezeDialog adminId={freezeId} open onOpenChange={(o) => !o && setFreezeId(null)} />}
    </>
  );
}
