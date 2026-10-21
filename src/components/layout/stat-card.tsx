import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Delta({ value, suffix = "%", inverse }: { value: number | null; suffix?: string; inverse?: boolean }) {
  if (value === null) return <span className="text-xs text-muted-foreground">no prior data</span>;
  const up = value > 0;
  const flat = value === 0;
  const good = inverse ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
        flat ? "bg-muted text-muted-foreground" : good ? "bg-success-soft text-success-ink" : "bg-destructive-soft text-destructive",
      )}
    >
      <Icon className="size-3.5" />
      {Math.abs(Math.round(value))}
      {suffix}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon,
  delta,
  hint,
  children,
  tone = "primary",
  className,
  style,
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  delta?: number | null;
  hint?: string;
  children?: React.ReactNode;
  tone?: "primary" | "gold" | "success" | "danger" | "info";
  className?: string;
  style?: React.CSSProperties;
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    gold: "bg-accent-soft text-warning-ink",
    success: "bg-success-soft text-success-ink",
    danger: "bg-destructive-soft text-destructive",
    info: "bg-info-soft text-info",
  } as const;
  return (
    <Card className={cn("animate-fade-up p-5", className)} style={style}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="tabular mt-1.5 text-[28px] font-bold leading-none tracking-tight">{value}</p>
        </div>
        <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl [&_svg]:size-5", tones[tone])}>{icon}</span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {delta !== undefined && <Delta value={delta} />}
        {hint && <span className="truncate">{hint}</span>}
      </div>
      {children}
    </Card>
  );
}
