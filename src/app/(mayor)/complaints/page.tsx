"use client";

import { useMemo, useState } from "react";
import { MessageSquareWarning, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Avatar } from "@/components/ui/avatar";
import { ComplaintStatusBadge, PriorityBadge } from "@/components/domain/badges";
import { ComplaintDetail } from "@/components/complaints/complaint-detail";
import { useMediaQuery } from "@/lib/use-media";
import { cn, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { ComplaintStatus } from "@/lib/types";

type Filter = "all" | ComplaintStatus;

export default function ComplaintsPage() {
  const complaints = useApp((s) => s.complaints);
  const users = useApp((s) => s.users);
  const desktop = useMediaQuery("(min-width: 1024px)");
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { all: complaints.length, new: 0, in_review: 0, resolved: 0, rejected: 0 };
    complaints.forEach((x) => (c[x.status] += 1));
    return c;
  }, [complaints]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return complaints.filter(
      (c) =>
        (filter === "all" || c.status === filter) &&
        (!needle || c.subject.toLowerCase().includes(needle) || c.category.toLowerCase().includes(needle) || (users.find((u) => u.id === c.userId)?.name.toLowerCase().includes(needle) ?? false)),
    );
  }, [complaints, filter, q, users]);

  const activeId = selected && rows.some((r) => r.id === selected) ? selected : desktop ? (rows[0]?.id ?? null) : null;

  const choose = (id: string) => {
    setSelected(id);
    if (!desktop) setMobileOpen(true);
  };

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Public complaints"
        description="Complaints that residents addressed to the mayor. Each conversation is private between you and the resident."
      />

      <Card className="overflow-hidden animate-fade-up">
        <div className="grid lg:h-[calc(100dvh-14rem)] lg:min-h-[560px] lg:grid-cols-[400px_1fr]">
          <div className="flex min-h-0 flex-col lg:border-r">
            <div className="space-y-3 border-b p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search complaints" className="pl-9" aria-label="Search complaints" />
              </div>
              <Segmented
                size="sm"
                value={filter}
                onChange={setFilter}
                label="Status"
                options={[
                  { value: "all", label: `All ${counts.all}` },
                  { value: "new", label: `New ${counts.new}` },
                  { value: "in_review", label: `Review ${counts.in_review}` },
                  { value: "resolved", label: `Done ${counts.resolved}` },
                ]}
              />
            </div>
            <div className="scrollbar-thin max-h-[60dvh] min-h-0 flex-1 overflow-y-auto lg:max-h-none">
              {rows.length === 0 ? (
                <EmptyState icon={<MessageSquareWarning />} title="No complaints here" description="Nothing matches this filter." />
              ) : (
                <ul className="divide-y">
                  {rows.map((c) => {
                    const u = users.find((x) => x.id === c.userId);
                    const active = c.id === activeId && desktop;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => choose(c.id)}
                          aria-current={active}
                          className={cn("relative flex w-full gap-3 p-4 text-left transition-colors hover:bg-muted/60", active && "bg-primary-soft")}
                        >
                          {c.unread && <span className="absolute left-1.5 top-6 size-2 rounded-full bg-accent" aria-label="Unread" />}
                          <Avatar name={u?.name ?? "?"} size={38} />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>{u?.name}</span>
                              <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(c.updatedAt)}</span>
                            </span>
                            <span className="mt-0.5 block truncate text-[13px]">{c.subject}</span>
                            <span className="mt-2 flex flex-wrap items-center gap-1.5">
                              <ComplaintStatusBadge status={c.status} />
                              {c.priority === "high" && <PriorityBadge priority="high" />}
                              <span className="text-[11px] text-muted-foreground">{c.category}</span>
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="hidden min-h-0 lg:block">
            {activeId ? (
              <ComplaintDetail key={activeId} id={activeId} />
            ) : (
              <EmptyState className="h-full" icon={<MessageSquareWarning />} title="Select a complaint" description="Choose a conversation on the left to read and reply." />
            )}
          </div>
        </div>
      </Card>

      {!desktop && (
        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent title="Complaint" className="max-w-full">
            {selected && <ComplaintDetail key={selected} id={selected} />}
          </SheetContent>
        </Dialog>
      )}
    </>
  );
}
