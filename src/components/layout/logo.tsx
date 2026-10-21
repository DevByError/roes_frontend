import { cn } from "@/lib/utils";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={cn("relative inline-block shrink-0 rounded-[28%] object-contain shadow-[0_8px_24px_-6px_rgb(38_101_174/0.45)]", className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export function Wordmark({ light = true, className }: { light?: boolean; className?: string }) {
  return (
    <div className={cn("leading-none", className)}>
      <div className={cn("text-[17px] font-bold tracking-[0.18em]", light ? "text-white" : "text-foreground")}>ROES</div>
      <div className={cn("mt-1.5 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.1em]", light ? "text-sidebar-foreground" : "text-muted-foreground")}>
        Royal Organizing Ecosystem
      </div>
    </div>
  );
}
