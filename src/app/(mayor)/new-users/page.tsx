"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Download, Search, TrendingUp, UserCheck, UserPlus, Zap } from "lucide-react";
import { format, parseISO, subMonths } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartCard } from "@/components/charts/chart-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { HBarList } from "@/components/charts/hbar-list";
import { PersonCell } from "@/components/domain/person";
import { UserStatusBadge } from "@/components/domain/badges";
import {
  RANGE_OPTIONS,
  bucketize,
  countInRange,
  defaultSelection,
  pctChange,
  resolveRange,
  type RangeMode,
  type RangeSelection,
} from "@/lib/ranges";
import { downloadCsv, fmtDateTime, nf } from "@/lib/utils";
import { useApp } from "@/store/app-store";

const PAGE = 10;

export default function NewUsersPage() {
  const users = useApp((s) => s.users);
  const places = useApp((s) => s.places);
  const [sel, setSel] = useState<RangeSelection>(defaultSelection);
  const [view, setView] = useState<"new" | "cumulative">("new");
  const [q, setQ] = useState("");
  const [placeId, setPlaceId] = useState("all");
  const [page, setPage] = useState(1);

  const now = useMemo(() => new Date(), []);
  const monthOptions = useMemo(
    () => Array.from({ length: 24 }, (_, i) => {
      const d = subMonths(now, i);
      return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
    }),
    [now],
  );
  const yearOptions = useMemo(() => [0, 1, 2].map((i) => now.getFullYear() - i), [now]);

  const range = useMemo(() => resolveRange(sel, now), [sel, now]);
  const joined = useMemo(() => users.map((u) => u.joinedAt), [users]);
  const buckets = useMemo(() => bucketize(joined, range), [joined, range]);

  const inRange = useMemo(
    () => users.filter((u) => {
      const d = parseISO(u.joinedAt);
      return d >= range.from && d <= range.to;
    }),
    [users, range],
  );
  const prevCount = useMemo(() => countInRange(joined, range.prevFrom, range.prevTo), [joined, range]);

  const unit = range.granularity === "day" ? "day" : range.granularity === "week" ? "week" : "month";
  const peak = buckets.reduce((m, b) => (b.count > m.count ? b : m), buckets[0] ?? { count: 0, fullLabel: "—", label: "", key: "", cumulative: 0 });
  const avg = buckets.length ? inRange.length / buckets.length : 0;
  const verified = inRange.filter((u) => u.status === "verified").length;

  const placeById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const byPlace = useMemo(() => {
    const m = new Map<string, number>();
    inRange.forEach((u) => m.set(u.placeId, (m.get(u.placeId) ?? 0) + 1));
    return [...m.entries()]
      .map(([id, value]) => ({ key: id, label: placeById.get(id)?.name ?? id, sublabel: placeById.get(id)?.district, value }))
      .sort((a, b) => b.value - a.value);
  }, [inRange, placeById]);

  const residential = places.filter((p) => p.kind === "residential");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return inRange.filter(
      (u) =>
        (placeId === "all" || u.placeId === placeId) &&
        (!needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)),
    );
  }, [inRange, q, placeId]);
  const pageRows = filtered.slice((page - 1) * PAGE, page * PAGE);

  const setMode = (mode: RangeMode) => {
    setSel((s) => ({ ...s, mode }));
    setPage(1);
  };

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="New users"
        description="See how many people joined your city in any period — this month, the last 3 months, a specific month or a whole year."
        actions={
          <Button
            variant="outline"
            disabled={!filtered.length}
            onClick={() =>
              downloadCsv(`new-users-${range.label.replace(/\s+/g, "-")}.csv`, [
                ["Name", "Email", "Residence", "Unit", "Status", "Joined"],
                ...filtered.map((u) => [u.name, u.email, placeById.get(u.placeId)?.name ?? "", u.unit, u.status, fmtDateTime(u.joinedAt)]),
              ])
            }
          >
            <Download /> Export CSV
          </Button>
        }
      />

      <Card className="mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center animate-fade-up">
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarRange className="size-4" /> Period
        </span>
        <Segmented value={sel.mode} onChange={setMode} options={RANGE_OPTIONS} label="Period" />
        {sel.mode === "specific-month" && (
          <Select value={sel.month} onValueChange={(month) => { setSel((s) => ({ ...s, month })); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-52" aria-label="Month"><SelectValue /></SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {sel.mode === "specific-year" && (
          <Select value={String(sel.year)} onValueChange={(y) => { setSel((s) => ({ ...s, year: Number(y) })); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Year"><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <span className="text-sm text-muted-foreground sm:ml-auto">
          Showing <strong className="text-foreground">{range.label}</strong>
        </span>
      </Card>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
        <StatCard label="New users" value={nf.format(inRange.length)} icon={<UserPlus />} delta={pctChange(inRange.length, prevCount)} hint={`vs ${nf.format(prevCount)} before`} />
        <StatCard label={`Average per ${unit}`} value={avg.toFixed(avg < 10 ? 1 : 0)} icon={<TrendingUp />} tone="info" hint={`across ${buckets.length} ${unit}s`} />
        <StatCard label={`Busiest ${unit}`} value={nf.format(peak.count)} icon={<Zap />} tone="gold" hint={peak.count ? peak.fullLabel : "No sign-ups yet"} />
        <StatCard label="Verified" value={inRange.length ? `${Math.round((verified / inRange.length) * 100)}%` : "—"} icon={<UserCheck />} tone="success" hint={`${verified} of ${inRange.length} verified`} />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title={view === "new" ? "Sign-ups over time" : "Cumulative growth"}
          description={`${range.label} · grouped by ${unit}`}
          actions={
            <Segmented
              size="sm"
              label="Metric"
              value={view}
              onChange={setView}
              options={[
                { value: "new", label: "New" },
                { value: "cumulative", label: "Cumulative" },
              ]}
            />
          }
          table={{ headers: [unit[0].toUpperCase() + unit.slice(1), "New", "Cumulative"], rows: buckets.map((b) => [b.fullLabel, b.count, b.cumulative]) }}
        >
          <TrendChart data={buckets} kind={view === "new" ? "bar" : "area"} metric={view === "new" ? "count" : "cumulative"} unit={view === "new" ? "new users" : "users in period"} height={300} />
        </ChartCard>

        <ChartCard
          title="Where they joined"
          description="Residences ranked by sign-ups"
          table={{ headers: ["Residence", "New users"], rows: byPlace.map((p) => [p.label, p.value]) }}
        >
          {byPlace.length ? (
            <HBarList items={byPlace.slice(0, 8)} onSelect={(k) => { setPlaceId(k); setPage(1); }} />
          ) : (
            <EmptyState icon={<UserPlus />} title="Nobody joined in this period" description="Pick a different period to see sign-ups." />
          )}
        </ChartCard>
      </section>

      <Card className="mt-4 animate-fade-up overflow-hidden">
        <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Who joined</CardTitle>
            <CardDescription>{nf.format(filtered.length)} users in {range.label}</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name or email" className="pl-9 sm:w-60" aria-label="Search joiners" />
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
        </CardHeader>
        {pageRows.length ? (
          <>
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>Resident</TH>
                  <TH className="hidden md:table-cell">Residence</TH>
                  <TH className="hidden sm:table-cell">Unit</TH>
                  <TH>Joined</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {pageRows.map((u) => (
                  <TR key={u.id}>
                    <TD><PersonCell name={u.name} sub={u.email} /></TD>
                    <TD className="hidden text-muted-foreground md:table-cell">{placeById.get(u.placeId)?.name}</TD>
                    <TD className="tabular hidden text-muted-foreground sm:table-cell">{u.unit}</TD>
                    <TD className="tabular whitespace-nowrap text-muted-foreground">{fmtDateTime(u.joinedAt)}</TD>
                    <TD><UserStatusBadge status={u.status} /></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={page} pageSize={PAGE} total={filtered.length} onPage={setPage} />
          </>
        ) : (
          <EmptyState icon={<Search />} title="No users match" description="Try another period, residence or search term." />
        )}
      </Card>
    </>
  );
}
