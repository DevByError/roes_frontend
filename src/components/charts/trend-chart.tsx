"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Bucket } from "@/lib/ranges";
import { nf } from "@/lib/utils";

interface TipProps {
  active?: boolean;
  payload?: { payload: Bucket & { value: number } }[];
  unit: string;
}

function Tip({ active, payload, unit }: TipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="min-w-36 rounded-xl border bg-popover px-3 py-2.5 text-popover-foreground shadow-[var(--shadow-pop)]">
      <p className="text-xs text-muted-foreground">{p.fullLabel}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
        <span className="size-2.5 rounded-[3px]" style={{ background: "var(--series-1)" }} />
        <span className="tabular">{nf.format(p.value)}</span>
        <span className="font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

const axisProps = {
  tick: { fill: "var(--chart-axis)", fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export function TrendChart({
  data,
  kind,
  metric = "count",
  unit = "new users",
  height = 280,
}: {
  data: Bucket[];
  kind: "area" | "bar";
  metric?: "count" | "cumulative";
  unit?: string;
  height?: number;
}) {
  const rows = data.map((d) => ({ ...d, value: d[metric] }));
  const many = rows.length > 16;
  const common = { data: rows, margin: { top: 8, right: 8, bottom: 0, left: -12 } };
  const interval = many ? Math.ceil(rows.length / 10) - 1 : 0;

  return (
    <div role="img" aria-label={`${kind === "bar" ? "Bar" : "Area"} chart of ${unit}`} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {kind === "area" ? (
          <AreaChart {...common}>
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="label" {...axisProps} interval={interval} tickMargin={8} />
            <YAxis {...axisProps} width={44} allowDecimals={false} tickFormatter={(v) => nf.format(v as number)} />
            <RTooltip cursor={{ stroke: "var(--chart-axis)", strokeDasharray: "3 3" }} content={(p) => <Tip {...(p as unknown as TipProps)} unit={unit} />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--series-1)"
              strokeWidth={2}
              fill="url(#trend-fill)"
              activeDot={{ r: 5, fill: "var(--series-1)", stroke: "var(--card)", strokeWidth: 2 }}
              dot={false}
              isAnimationActive
              animationDuration={700}
            />
          </AreaChart>
        ) : (
          <BarChart {...common} barCategoryGap={rows.length > 20 ? 2 : "22%"}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey="label" {...axisProps} interval={interval} tickMargin={8} />
            <YAxis {...axisProps} width={44} allowDecimals={false} tickFormatter={(v) => nf.format(v as number)} />
            <RTooltip cursor={{ fill: "var(--muted)", opacity: 0.7 }} content={(p) => <Tip {...(p as unknown as TipProps)} unit={unit} />} />
            <Bar dataKey="value" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive animationDuration={700} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
