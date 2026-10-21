import { Lock } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function DetailRow({ label, value, locked, mono }: { label: string; value: React.ReactNode; locked?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        {label}
        {locked && (
          <Tooltip content="Personal details can only be changed by the account owner">
            <Lock className="size-3 text-muted-foreground/70" aria-label="Read-only" />
          </Tooltip>
        )}
      </dt>
      <dd className={cn("min-w-0 break-words text-right text-sm font-medium", mono && "font-mono text-[13px]")}>{value}</dd>
    </div>
  );
}

export function ReadOnlyNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-info/20 bg-info-soft p-3 text-[13px] text-info">
      <Lock className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
