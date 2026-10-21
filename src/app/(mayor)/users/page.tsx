"use client";

import { useMemo, useState } from "react";
import { Download, Search, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PersonCell } from "@/components/domain/person";
import { UserStatusBadge } from "@/components/domain/badges";
import { UserSheet } from "@/components/users/user-sheet";
import { downloadCsv, fmtDate, nf, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { UserStatus } from "@/lib/types";

const PAGE = 12;

export default function UsersPage() {
  const users = useApp((s) => s.users);
  const places = useApp((s) => s.places);
  const [q, setQ] = useState(() => new URLSearchParams(window.location.search).get("q") ?? "");
  const [placeId, setPlaceId] = useState(() => new URLSearchParams(window.location.search).get("place") ?? "all");
  const [status, setStatus] = useState<"all" | UserStatus>("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const residential = places.filter((p) => p.kind === "residential");
  const counts = useMemo(
    () => ({
      all: users.length,
      verified: users.filter((u) => u.status === "verified").length,
      pending: users.filter((u) => u.status === "pending").length,
      frozen: users.filter((u) => u.status === "frozen").length,
    }),
    [users],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter(
      (u) =>
        (status === "all" || u.status === status) &&
        (placeId === "all" || u.placeId === placeId) &&
        (!needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle) || u.unit.toLowerCase().includes(needle)),
    );
  }, [users, q, placeId, status]);
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);

  return (
    <>
      <PageHeader
        eyebrow="People"
        title="Users"
        description="Everyone registered in your city. You can browse and search their details, but personal information is read-only."
        actions={
          <Button
            variant="outline"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv("users.csv", [
                ["Name", "Email", "Residence", "Unit", "Status", "Role", "Joined"],
                ...filtered.map((u) => [u.name, u.email, placeById.get(u.placeId)?.name ?? "", u.unit, u.status, u.role, fmtDate(u.joinedAt)]),
              ])
            }
          >
            <Download /> Export CSV
          </Button>
        }
      />

      <Card className="overflow-hidden animate-fade-up">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            label="Status"
            options={[
              { value: "all", label: `All ${nf.format(counts.all)}` },
              { value: "verified", label: `Verified ${nf.format(counts.verified)}` },
              { value: "pending", label: `Pending ${counts.pending}` },
              { value: "frozen", label: `Frozen ${counts.frozen}` },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, email or unit" className="pl-9 sm:w-64" aria-label="Search users" />
            </div>
            <Select value={placeId} onValueChange={(v) => { setPlaceId(v); setPage(1); }}>
              <SelectTrigger className="sm:w-56" aria-label="Residence"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All residences</SelectItem>
                {residential.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={<Users />} title="No users match your filters" description="Try clearing the search or choosing another residence." action={<Button variant="outline" onClick={() => { setQ(""); setPlaceId("all"); setStatus("all"); }}>Clear filters</Button>} />
        ) : (
          <>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>User</TH>
                  <TH className="hidden md:table-cell">Residence</TH>
                  <TH className="hidden lg:table-cell">Unit</TH>
                  <TH className="hidden sm:table-cell">Joined</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((u) => (
                  <TR key={u.id} data-clickable="true" onClick={() => setOpenId(u.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpenId(u.id)}>
                    <TD>
                      <div className="flex items-center gap-2">
                        <PersonCell name={u.name} sub={u.email} />
                        {u.role === "admin" && <Badge tone="primary"><ShieldCheck /> Admin</Badge>}
                      </div>
                    </TD>
                    <TD className="hidden text-muted-foreground md:table-cell">{placeById.get(u.placeId)?.name}</TD>
                    <TD className="tabular hidden font-mono text-[13px] text-muted-foreground lg:table-cell">{u.unit}</TD>
                    <TD className="hidden whitespace-nowrap text-muted-foreground sm:table-cell" title={fmtDate(u.joinedAt)}>{timeAgo(u.joinedAt)}</TD>
                    <TD><UserStatusBadge status={u.status} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={PAGE} total={filtered.length} onPage={setPage} />
          </>
        )}
      </Card>

      <UserSheet userId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
