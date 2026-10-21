"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, List, Map as MapIcon, MapPinOff, Plus, Search, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { KindBadge } from "@/components/domain/badges";
import { PlaceSheet } from "@/components/places/place-sheet";
import { PlaceDialog } from "@/components/places/place-dialog";
import { AssignDialog, ManagePlaces, type ManageFilter } from "@/components/places/manage-tab";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

const PlacesMap = dynamic(() => import("@/components/map/places-map"), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

type Kind = "all" | "residential" | "non-residential";

export default function PlacesPage() {
  const places = useApp((s) => s.places);
  const CITY = useApp((s) => s.city);
  const users = useApp((s) => s.users);
  const admins = useApp((s) => s.admins);
  const [kind, setKind] = useState<Kind>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const router = useRouter();
  const [tab, setTab] = useState<"map" | "manage">(() => (new URLSearchParams(window.location.search).get("tab") === "manage" ? "manage" : "map"));
  const [initialFilter] = useState<ManageFilter>(() => (new URLSearchParams(window.location.search).get("filter") === "unassigned" ? "unassigned" : "all"));
  const [dialog, setDialog] = useState<{ id: string | null; nonce: number } | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  const countByPlace = useMemo(() => {
    const m = new Map<string, number>();
    users.forEach((u) => m.set(u.placeId, (m.get(u.placeId) ?? 0) + 1));
    return m;
  }, [users]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return places.filter(
      (p) =>
        (kind === "all" || p.kind === kind) &&
        (!needle || p.name.toLowerCase().includes(needle) || p.district.toLowerCase().includes(needle) || p.category.toLowerCase().includes(needle)),
    );
  }, [places, kind, q]);

  const res = places.filter((p) => p.kind === "residential").length;
  const vacant = places.filter((p) => !p.adminId).length;
  const editPlace = dialog?.id ? places.find((p) => p.id === dialog.id) ?? null : null;
  const openDialog = (id: string | null) => setDialog({ id, nonce: Date.now() });

  const select = (id: string) => {
    setSelected(id);
    setSheetId(id);
  };

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Places"
        description={`Create and manage every residence and public place in ${CITY.name}, see where they are and who looks after them.`}
        actions={<Button onClick={() => openDialog(null)}><Plus /> Add place</Button>}
      />

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4" aria-label="Place summary">
        <StatCard label="Total places" value={places.length} icon={<Building2 />} hint="across the city" />
        <StatCard label="Residential" value={res} icon={<Users />} tone="info" hint={`${users.length.toLocaleString()} residents`} />
        <StatCard label="Non-residential" value={places.length - res} icon={<MapIcon />} tone="gold" hint="public & commercial" />
        <StatCard label="Unassigned" value={vacant} icon={vacant ? <MapPinOff /> : <UserCheck />} tone={vacant ? "gold" : "success"} hint={vacant ? "waiting for an admin" : "every place has an admin"} />
      </section>

      <Tabs value={tab} onValueChange={(v) => setTab(v as "map" | "manage")} className="mt-4">
        <TabsList aria-label="Places sections">
          <TabsTrigger value="map"><MapIcon /> Map &amp; list</TabsTrigger>
          <TabsTrigger value="manage">
            <Building2 /> Manage places
            {vacant > 0 && <span className="tabular rounded-full bg-warning-soft px-1.5 text-[11px] font-semibold text-warning-ink">{vacant} unassigned</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <ManagePlaces initialFilter={initialFilter} onOpen={(id) => setSheetId(id)} onEdit={(id) => openDialog(id)} onAdd={() => openDialog(null)} onNewAdmin={() => router.push("/admins?new=1")} />
        </TabsContent>

        <TabsContent value="map" className="mt-4">

      <Card className="overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={kind}
            onChange={setKind}
            label="Place type"
            options={[
              { value: "all", label: `All ${places.length}` },
              { value: "residential", label: `Residential ${res}` },
              { value: "non-residential", label: `Non-residential ${places.length - res}` },
            ]}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or district" className="pl-9" aria-label="Search places" />
            </div>
            <Segmented
              className="lg:hidden"
              value={mobileView}
              onChange={setMobileView}
              label="View"
              options={[
                { value: "map", label: "Map", icon: <MapIcon /> },
                { value: "list", label: "List", icon: <List /> },
              ]}
            />
          </div>
        </div>

        <div className="grid lg:h-[640px] lg:grid-cols-[380px_1fr]">
          <div className={cn("scrollbar-thin max-h-[560px] overflow-y-auto border-b lg:max-h-none lg:border-b-0 lg:border-r", mobileView === "map" && "hidden lg:block")}>
            {filtered.length === 0 ? (
              <EmptyState icon={<Building2 />} title="No places found" description="Try another type or search term." />
            ) : (
              <ul className="divide-y">
                {filtered.map((p) => {
                  const admin = admins.find((a) => a.id === p.adminId);
                  const active = p.id === selected;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => select(p.id)}
                        aria-current={active}
                        className={cn("flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/60", active && "bg-primary-soft")}
                      >
                        <span className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl", p.kind === "residential" ? "bg-primary-soft text-primary" : "bg-accent-soft text-warning-ink")}>
                          <Building2 className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{p.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">{p.category} · {p.district}</span>
                          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <KindBadge kind={p.kind} />
                            {p.kind === "residential" && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3.5" /> {countByPlace.get(p.id) ?? 0}</span>
                            )}
                            <span className={cn("text-xs", admin ? "text-muted-foreground" : "text-warning-ink")}>{admin ? admin.name : "No admin"}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className={cn("relative h-[480px] bg-muted lg:h-auto", mobileView === "list" && "hidden lg:block")}>
            <PlacesMap places={filtered} allPlaces={places} selectedId={selected} onSelect={select} center={CITY.center} />
            <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex gap-3 rounded-xl border bg-card/90 px-3 py-2 text-xs shadow-lg backdrop-blur">
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" /> Residential</span>
              <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-accent" /> Non-residential</span>
            </div>
          </div>
        </div>
      </Card>
        </TabsContent>
      </Tabs>

      <PlaceSheet placeId={sheetId} onClose={() => setSheetId(null)} onEdit={(id) => { setSheetId(null); openDialog(id); }} onAssign={(id) => { setSheetId(null); setAssignId(id); }} />
      {dialog && <PlaceDialog key={dialog.nonce} place={editPlace} open onOpenChange={(o) => !o && setDialog(null)} />}
      <AssignDialog key={`a-${assignId ?? "none"}`} place={places.find((p) => p.id === assignId) ?? null} onClose={() => setAssignId(null)} onNewAdmin={() => router.push("/admins?new=1")} />
    </>
  );
}
