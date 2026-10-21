"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  HeartHandshake,
  Megaphone,
  MessageSquareWarning,
  ShieldCheck,
  TriangleAlert,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";
import { endOfDay, startOfDay, startOfMonth, subDays, subMonths } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChartCard } from "@/components/charts/chart-card";
import { TrendChart } from "@/components/charts/trend-chart";
import { HBarList } from "@/components/charts/hbar-list";
import { Sparkline } from "@/components/charts/sparkline";
import { PersonCell } from "@/components/domain/person";
import { AdminStatusBadge, UserStatusBadge } from "@/components/domain/badges";
import { bucketize, countInRange, customRange, pctChange } from "@/lib/ranges";
import { compact, money, nf, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { ActivityItem } from "@/lib/types";

const FEED_ICON = {
  user: UserPlus,
  complaint: MessageSquareWarning,
  admin: UserCog,
  donation: HeartHandshake,
  policy: ShieldCheck,
  announcement: Megaphone,
} as const;

const FEED_TONE: Record<ActivityItem["kind"], string> = {
  user: "bg-primary-soft text-primary",
  complaint: "bg-accent-soft text-warning-ink",
  admin: "bg-info-soft text-info",
  donation: "bg-success-soft text-success-ink",
  policy: "bg-info-soft text-info",
  announcement: "bg-primary-soft text-primary",
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const mayor = useApp((s) => s.mayor);
  const users = useApp((s) => s.users);
  const admins = useApp((s) => s.admins);
  const places = useApp((s) => s.places);
  const complaints = useApp((s) => s.complaints);
  const donations = useApp((s) => s.donations);
  const activity = useApp((s) => s.activity);
  const [span, setSpan] = useState<"30d" | "12m">("30d");

  const joined = useMemo(() => users.map((u) => u.joinedAt), [users]);

  const stats = useMemo(() => {
    const now = new Date();
    const l30 = countInRange(joined, startOfDay(subDays(now, 29)), endOfDay(now));
    const p30 = countInRange(joined, startOfDay(subDays(now, 59)), endOfDay(subDays(now, 30)));
    const monthFrom = startOfMonth(now);
    const monthSpan = Math.max(1, Math.ceil((+now - +monthFrom) / 86400000));
    const thisMonth = countInRange(joined, monthFrom, endOfDay(now));
    const prevMonth = countInRange(joined, startOfDay(subDays(monthFrom, monthSpan)), endOfDay(subDays(monthFrom, 1)));
    const spark = bucketize(joined, customRange(startOfDay(subDays(now, 13)), endOfDay(now), "day", "14 days")).map((b) => b.count);
    return { l30, p30, thisMonth, prevMonth, spark };
  }, [joined]);

  const growth = useMemo(() => {
    const now = new Date();
    const r =
      span === "30d"
        ? customRange(startOfDay(subDays(now, 29)), endOfDay(now), "day", "Last 30 days")
        : customRange(startOfMonth(subMonths(now, 11)), endOfDay(now), "month", "Last 12 months");
    return bucketize(joined, r);
  }, [joined, span]);

  const activeAdmins = admins.filter((a) => a.status === "active").length;
  const frozenAdmins = admins.length - activeAdmins;
  const unassigned = admins.filter((a) => !a.placeId).length;
  const placesWithoutAdmin = places.filter((p) => !p.adminId).length;
  const residential = places.filter((p) => p.kind === "residential");

  const perPlace = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach((u) => map.set(u.placeId, (map.get(u.placeId) ?? 0) + 1));
    return residential
      .map((p) => ({ key: p.id, label: p.name, sublabel: p.district, value: map.get(p.id) ?? 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [users, residential]);

  const complaintStats = useMemo(() => {
    const by = { new: 0, in_review: 0, resolved: 0, rejected: 0 };
    complaints.forEach((c) => (by[c.status] += 1));
    const cat = new Map<string, number>();
    complaints.forEach((c) => cat.set(c.category, (cat.get(c.category) ?? 0) + 1));
    return {
      by,
      cats: [...cat.entries()].map(([label, value]) => ({ key: label, label, value })).sort((a, b) => b.value - a.value).slice(0, 4),
    };
  }, [complaints]);

  const placeName = (id: string) => places.find((p) => p.id === id)?.name ?? "—";
  const recent = users.slice(0, 7);
  const activeDonations = donations.filter((d) => d.status === "active");
  const raised = donations.reduce((a, d) => a + d.raised, 0);

  const segs = [
    { k: "new", label: "New", color: "var(--accent)", n: complaintStats.by.new },
    { k: "in_review", label: "In review", color: "var(--series-1)", n: complaintStats.by.in_review },
    { k: "resolved", label: "Resolved", color: "var(--status-good)", n: complaintStats.by.resolved },
    { k: "rejected", label: "Declined", color: "var(--chart-axis)", n: complaintStats.by.rejected },
  ];
  const segTotal = Math.max(1, complaints.length);

  return (
    <>
      <PageHeader
        eyebrow={`${mayor.city} · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`}
        title={`${greeting()}, ${mayor.name.split(" ")[0]}`}
        description="Here is what is happening across your city right now."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/donations">
                <HeartHandshake /> New donation post
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admins?new=1">
                <UserCog /> Create admin
              </Link>
            </Button>
          </>
        }
      />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={nf.format(users.length)}
          icon={<Users />}
          delta={pctChange(stats.l30, stats.p30)}
          hint={`+${stats.l30} in 30 days`}
          style={{ animationDelay: "0ms" }}
        />
        <StatCard
          label="New this month"
          value={nf.format(stats.thisMonth)}
          icon={<UserPlus />}
          tone="success"
          delta={pctChange(stats.thisMonth, stats.prevMonth)}
          hint="vs previous period"
          style={{ animationDelay: "60ms" }}
        >
          <div className="-mx-1 mt-2">
            <Sparkline values={stats.spark} height={36} />
          </div>
        </StatCard>
        <StatCard
          label="Active admins"
          value={`${activeAdmins}/${admins.length}`}
          icon={<UserCog />}
          tone="info"
          hint={`${frozenAdmins} frozen · ${unassigned} unassigned`}
          style={{ animationDelay: "120ms" }}
        />
        <StatCard
          label="Open complaints"
          value={complaintStats.by.new}
          icon={<MessageSquareWarning />}
          tone="gold"
          hint={`${complaintStats.by.in_review} in review`}
          style={{ animationDelay: "180ms" }}
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <ChartCard
          className="lg:col-span-2"
          title="Resident growth"
          description="New users joining your city"
          actions={
            <Segmented
              size="sm"
              label="Time span"
              value={span}
              onChange={setSpan}
              options={[
                { value: "30d", label: "30 days" },
                { value: "12m", label: "12 months" },
              ]}
            />
          }
          table={{ headers: ["Period", "New users"], rows: growth.map((b) => [b.fullLabel, b.count]) }}
          footer={
            <span>
              <strong className="tabular text-foreground">{nf.format(growth.reduce((a, b) => a + b.count, 0))}</strong> new users in this span ·{" "}
              <Link href="/new-users" className="font-medium text-primary hover:underline">
                Open full analysis
              </Link>
            </span>
          }
        >
          <TrendChart data={growth} kind="area" height={290} />
        </ChartCard>

        <Card className="flex flex-col animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                Live activity
                <span className="relative grid size-2 place-items-center">
                  <span className="absolute inline-flex size-2 animate-ping-slow rounded-full bg-success/70" />
                  <span className="relative size-2 rounded-full bg-success" />
                </span>
              </CardTitle>
              <CardDescription>Updates as residents act</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="scrollbar-thin max-h-[360px] flex-1 overflow-y-auto pt-2">
            <ul className="space-y-1">
              {activity.slice(0, 9).map((a, i) => {
                const Icon = FEED_ICON[a.kind];
                return (
                  <li key={a.id} className={`flex gap-3 rounded-lg p-2 ${i === 0 ? "animate-fade-up bg-muted/60" : ""}`}>
                    <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${FEED_TONE[a.kind]}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-snug">{a.text}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard
          title="Users by residence"
          description="Top residential places"
          table={{ headers: ["Residence", "Users"], rows: perPlace.map((p) => [p.label, p.value]) }}
          footer={
            <Link href="/places" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              See all places <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          <HBarList items={perPlace} />
        </ChartCard>

        <ChartCard
          title="Public complaints"
          description={`${complaints.length} received · ${Math.round((complaintStats.by.resolved / segTotal) * 100)}% resolved`}
          table={{ headers: ["Status", "Complaints"], rows: segs.map((s) => [s.label, s.n]) }}
          footer={
            <Link href="/complaints" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Open inbox <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="Complaints by status">
            {segs.map((s) => (
              <div key={s.k} style={{ width: `${(s.n / segTotal) * 100}%`, background: s.color }} className="min-w-[3px] first:rounded-l-full last:rounded-r-full" title={`${s.label}: ${s.n}`} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
            {segs.map((s) => (
              <li key={s.k} className="flex items-center gap-2">
                <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
                <span className="text-muted-foreground">{s.label}</span>
                <span className="tabular ml-auto font-semibold">{s.n}</span>
              </li>
            ))}
          </ul>
          <p className="mb-3 mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top categories</p>
          <HBarList items={complaintStats.cats} />
        </ChartCard>

        <Card className="animate-fade-up md:col-span-2 xl:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Donation campaigns</CardTitle>
              <CardDescription>
                {money.format(raised)} raised · {activeDonations.length} active
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {donations.slice(0, 4).map((d) => {
              const pct = Math.min(100, Math.round((d.raised / d.goal) * 100));
              return (
                <div key={d.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <p className="truncate text-[13px] font-medium">{d.title}</p>
                    <span className="tabular shrink-0 text-xs font-semibold">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(2, pct)}%`, background: d.status === "closed" ? "var(--status-good)" : "var(--series-1)" }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {compact.format(d.raised)} of {compact.format(d.goal)} MYR · {d.donors} donors
                  </p>
                </div>
              );
            })}
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href="/donations">Manage campaigns</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="animate-fade-up lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Latest registrations</CardTitle>
              <CardDescription>The newest residents across the city</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/users">
                View all <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Resident</TH>
                <TH className="hidden sm:table-cell">Residence</TH>
                <TH>Joined</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {recent.map((u) => (
                <TR key={u.id}>
                  <TD>
                    <PersonCell name={u.name} sub={u.email} />
                  </TD>
                  <TD className="hidden text-muted-foreground sm:table-cell">{placeName(u.placeId)}</TD>
                  <TD className="tabular whitespace-nowrap text-muted-foreground">{timeAgo(u.joinedAt)}</TD>
                  <TD>
                    <UserStatusBadge status={u.status} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card className="animate-fade-up">
          <CardHeader>
            <div>
              <CardTitle>Admin roster</CardTitle>
              <CardDescription>
                <Building2 className="mr-1 inline size-3.5 align-[-2px]" />
                {places.length} places · {places.length - placesWithoutAdmin} covered
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admins">
                Manage <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {(placesWithoutAdmin > 0 || unassigned > 0) && (
              <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-warning-soft p-3 text-[13px] text-warning-ink">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <p>
                  {placesWithoutAdmin} place{placesWithoutAdmin === 1 ? "" : "s"} without an admin
                  {unassigned > 0 && ` · ${unassigned} admin${unassigned === 1 ? "" : "s"} waiting for a place`}.
                </p>
              </div>
            )}
            {admins.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg p-2 hover:bg-muted/60">
                <PersonCell name={a.name} sub={places.find((p) => p.id === a.placeId)?.name ?? "No place yet"} size={34} />
                <AdminStatusBadge status={a.status} />
              </div>
            ))}
            {admins.length > 6 && (
              <Badge tone="neutral" className="mt-2">
                +{admins.length - 6} more admins
              </Badge>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
