import { AlertTriangle, BadgeCheck, CheckCircle2, CircleDot, Clock3, Snowflake, XCircle, Info, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AdminStatus, ComplaintStatus, PolicySeverity, UserStatus } from "@/lib/types";

export function AdminStatusBadge({ status }: { status: AdminStatus }) {
  return status === "active" ? (
    <Badge tone="success"><CheckCircle2 /> Active</Badge>
  ) : (
    <Badge tone="info"><Snowflake /> Frozen</Badge>
  );
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  if (status === "verified") return <Badge tone="success"><BadgeCheck /> Verified</Badge>;
  if (status === "pending") return <Badge tone="warning"><Clock3 /> Pending</Badge>;
  return <Badge tone="info"><Snowflake /> Frozen</Badge>;
}

export const COMPLAINT_LABEL: Record<ComplaintStatus, string> = {
  new: "New",
  in_review: "In review",
  resolved: "Resolved",
  rejected: "Declined",
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  switch (status) {
    case "new":
      return <Badge tone="gold"><CircleDot /> New</Badge>;
    case "in_review":
      return <Badge tone="info"><Clock3 /> In review</Badge>;
    case "resolved":
      return <Badge tone="success"><CheckCircle2 /> Resolved</Badge>;
    default:
      return <Badge tone="neutral"><XCircle /> Declined</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority: "low" | "medium" | "high" }) {
  if (priority === "high") return <Badge tone="danger"><Flame /> High</Badge>;
  if (priority === "medium") return <Badge tone="warning">Medium</Badge>;
  return <Badge tone="neutral">Low</Badge>;
}

export function SeverityBadge({ severity }: { severity: PolicySeverity }) {
  if (severity === "critical") return <Badge tone="danger"><AlertTriangle /> Critical</Badge>;
  if (severity === "important") return <Badge tone="warning"><AlertTriangle /> Important</Badge>;
  return <Badge tone="info"><Info /> Info</Badge>;
}

export function KindBadge({ kind }: { kind: "residential" | "non-residential" }) {
  return kind === "residential" ? <Badge tone="primary">Residential</Badge> : <Badge tone="gold">Non-residential</Badge>;
}
