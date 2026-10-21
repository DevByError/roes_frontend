import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export function MayorAvatar({ size = 38, className, ring }: { size?: number; className?: string; ring?: boolean }) {
  const mayor = useApp((s) => s.mayor);
  return <Avatar name={mayor.name} src={mayor.photo} size={size} className={className} ring={ring} />;
}

export function PersonCell({
  name,
  sub,
  size = 36,
  className,
}: {
  name: string;
  sub?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium leading-tight">{name}</p>
        {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
