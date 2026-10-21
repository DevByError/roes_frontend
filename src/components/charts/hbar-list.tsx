"use client";

import { cn, nf } from "@/lib/utils";

export interface HBarItem {
  key: string;
  label: string;
  value: number;
  sublabel?: string;
}

export function HBarList({
  items,
  max,
  onSelect,
  unit,
  className,
}: {
  items: HBarItem[];
  max?: number;
  onSelect?: (key: string) => void;
  unit?: string;
  className?: string;
}) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((a, b) => a + b.value, 0);
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((it, i) => {
        const Row = onSelect ? "button" : "div";
        return (
          <li key={it.key}>
            <Row
              {...(onSelect ? { type: "button" as const, onClick: () => onSelect(it.key) } : {})}
              className={cn("group block w-full text-left", onSelect && "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring")}
            >
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate font-medium">
                  {it.label}
                  {it.sublabel && <span className="ml-2 text-xs font-normal text-muted-foreground">{it.sublabel}</span>}
                </span>
                <span className="tabular shrink-0 font-semibold">
                  {nf.format(it.value)}
                  {unit && <span className="ml-1 font-normal text-muted-foreground">{unit}</span>}
                  {total > 0 && <span className="ml-2 text-xs font-normal text-muted-foreground">{Math.round((it.value / total) * 100)}%</span>}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out group-hover:brightness-110"
                  style={{ width: `${Math.max(2, (it.value / top) * 100)}%`, background: "var(--series-1)", transitionDelay: `${i * 40}ms` }}
                />
              </div>
            </Row>
          </li>
        );
      })}
    </ul>
  );
}
