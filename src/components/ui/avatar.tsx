import { portraitUri } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = 36,
  className,
  ring,
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  return (
    <img
      src={src || portraitUri(name)}
      alt=""
      aria-hidden
      width={size}
      height={size}
      draggable={false}
      className={cn("inline-block shrink-0 select-none rounded-full bg-muted object-cover", ring && "ring-2 ring-card", className)}
      style={{ width: size, height: size }}
    />
  );
}
