"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("scrollbar-thin inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all [&_svg]:size-3.5",
              size === "sm" ? "h-7 px-2.5 text-xs" : "h-8 px-3 text-[13px]",
              active ? "bg-card text-foreground shadow-sm dark:text-primary dark:ring-1 dark:ring-primary/40" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
