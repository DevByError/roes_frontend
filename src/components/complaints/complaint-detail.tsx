"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Building2, Mail, Send } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MayorAvatar } from "@/components/domain/person";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ComplaintStatusBadge, PriorityBadge } from "@/components/domain/badges";
import { cn, fmtDateTime, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { ComplaintStatus } from "@/lib/types";

const QUICK = [
  "Thank you for reporting this. We are looking into it.",
  "This has been forwarded to the responsible department.",
  "The issue has been resolved. Please let us know if it persists.",
];

export function ComplaintDetail({ id }: { id: string }) {
  const complaint = useApp((s) => s.complaints.find((c) => c.id === id));
  const user = useApp((s) => s.users.find((u) => u.id === complaint?.userId));
  const place = useApp((s) => s.places.find((p) => p.id === user?.placeId));
  const reply = useApp((s) => s.replyComplaint);
  const setStatus = useApp((s) => s.setComplaintStatus);
  const markRead = useApp((s) => s.markComplaintRead);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (complaint?.unread) markRead(id);
  }, [id, complaint?.unread, markRead]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [complaint?.messages.length, id]);

  if (!complaint) return null;

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    if (!(await reply(complaint.id, t))) return;
    setText("");
    toast.success("Reply sent", { description: `${user?.name ?? "The resident"} will be notified.` });
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b p-5 pr-14 lg:pr-5">
        <div className="flex flex-wrap items-center gap-2">
          <ComplaintStatusBadge status={complaint.status} />
          <PriorityBadge priority={complaint.priority} />
          <span className="text-xs text-muted-foreground">{complaint.category}</span>
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug tracking-tight">{complaint.subject}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Received {fmtDateTime(complaint.createdAt)}</p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          {user && (
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={user.name} size={38} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="flex items-center gap-3 truncate text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{place?.name}</span>
                  <span className="hidden items-center gap-1 sm:inline-flex"><Mail className="size-3" />{user.email}</span>
                </p>
              </div>
            </div>
          )}
          <Select value={complaint.status} onValueChange={async (v) => { if (await setStatus(complaint.id, v as ComplaintStatus)) toast.success("Status updated"); }}>
            <SelectTrigger className="h-9 w-40" aria-label="Status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_review">In review</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto bg-muted/30 p-5">
        {complaint.messages.map((m) => {
          const mine = m.from === "mayor";
          return (
            <div key={m.id} className={cn("flex gap-2.5 animate-fade-up", mine && "flex-row-reverse")}>
              {mine ? <MayorAvatar size={30} className="mt-0.5" /> : <Avatar name={user?.name ?? "Resident"} size={30} className="mt-0.5" />}
              <div className={cn("max-w-[82%]", mine && "text-right")}>
                <div className={cn("inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed", mine ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border bg-card")}>
                  {m.text}
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{mine ? "You" : user?.name} · {timeAgo(m.at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t p-4">
        <div className="scrollbar-thin mb-2.5 flex gap-2 overflow-x-auto pb-1">
          {QUICK.map((q) => (
            <button key={q} type="button" onClick={() => setText(q)} className="shrink-0 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary">
              {q.length > 36 ? q.slice(0, 36) + "…" : q}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
            rows={2}
            placeholder="Write a reply to the resident…"
            aria-label="Reply"
            className="min-h-0 flex-1 resize-none"
          />
          <Button onClick={send} disabled={!text.trim()} aria-label="Send reply"><Send /> <span className="hidden sm:inline">Send</span></Button>
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground">This conversation is private between you and the resident. Press Ctrl/⌘ + Enter to send.</p>
      </div>
    </div>
  );
}
