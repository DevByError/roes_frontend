import {
  addDays,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  differenceInCalendarWeeks,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
} from "date-fns";

export type RangeMode = "current-month" | "last-3-months" | "specific-month" | "current-year" | "specific-year";

export interface RangeSelection {
  mode: RangeMode;
  month: string;
  year: number;
}

export type Granularity = "day" | "week" | "month";

export interface ResolvedRange {
  from: Date;
  to: Date;
  label: string;
  granularity: Granularity;
  prevFrom: Date;
  prevTo: Date;
  prevLabel: string;
}

export const RANGE_OPTIONS: { value: RangeMode; label: string }[] = [
  { value: "current-month", label: "This month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "specific-month", label: "Pick a month" },
  { value: "current-year", label: "This year" },
  { value: "specific-year", label: "Pick a year" },
];

export function defaultSelection(now = new Date()): RangeSelection {
  return { mode: "current-month", month: format(now, "yyyy-MM"), year: now.getFullYear() };
}

export function resolveRange(sel: RangeSelection, now = new Date()): ResolvedRange {
  const today = endOfDay(now);
  let from: Date;
  let to: Date;
  let label: string;
  let granularity: Granularity;

  switch (sel.mode) {
    case "current-month":
      from = startOfMonth(now);
      to = today;
      label = format(now, "MMMM yyyy");
      granularity = "day";
      break;
    case "last-3-months":
      from = startOfDay(subMonths(now, 3));
      to = today;
      label = `${format(from, "d MMM")} – ${format(now, "d MMM yyyy")}`;
      granularity = "week";
      break;
    case "specific-month": {
      const [y, m] = sel.month.split("-").map(Number);
      from = startOfMonth(new Date(y, m - 1, 1));
      to = endOfMonth(from);
      if (to > today && from <= today) to = today;
      label = format(from, "MMMM yyyy");
      granularity = "day";
      break;
    }
    case "current-year":
      from = startOfYear(now);
      to = today;
      label = String(now.getFullYear());
      granularity = "month";
      break;
    case "specific-year":
    default:
      from = startOfYear(new Date(sel.year, 0, 1));
      to = endOfYear(from);
      if (to > today && from <= today) to = today;
      label = String(sel.year);
      granularity = "month";
      break;
  }

  const spanDays = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const prevTo = endOfDay(subDays(from, 1));
  const prevFrom = startOfDay(subDays(from, spanDays));
  const prevLabel = `${format(prevFrom, "d MMM yyyy")} – ${format(prevTo, "d MMM yyyy")}`;
  return { from, to, label, granularity, prevFrom, prevTo, prevLabel };
}

export interface Bucket {
  key: string;
  label: string;
  fullLabel: string;
  count: number;
  cumulative: number;
}

export function bucketize(dates: string[], r: ResolvedRange): Bucket[] {
  let starts: Date[];
  if (r.granularity === "day") starts = eachDayOfInterval({ start: r.from, end: r.to });
  else if (r.granularity === "week")
    starts = eachWeekOfInterval({ start: r.from, end: r.to }, { weekStartsOn: 1 }).map((d) => (d < r.from ? r.from : d));
  else starts = eachMonthOfInterval({ start: r.from, end: r.to });

  const counts = new Array(starts.length).fill(0) as number[];
  for (const iso of dates) {
    const d = parseISO(iso);
    if (d < r.from || d > r.to) continue;
    const idx =
      r.granularity === "day"
        ? differenceInCalendarDays(d, r.from)
        : r.granularity === "week"
          ? differenceInCalendarWeeks(d, r.from, { weekStartsOn: 1 })
          : differenceInCalendarMonths(d, r.from);
    if (idx >= 0 && idx < counts.length) counts[idx]++;
  }
  let cum = 0;
  return starts.map((s, i) => {
    cum += counts[i];
    const label = r.granularity === "day" ? format(s, "d") : r.granularity === "week" ? format(s, "d MMM") : format(s, "MMM");
    const fullLabel =
      r.granularity === "day"
        ? format(s, "EEE d MMM yyyy")
        : r.granularity === "week"
          ? `Week of ${format(s, "d MMM yyyy")}`
          : format(s, "MMMM yyyy");
    return { key: s.toISOString(), label, fullLabel, count: counts[i], cumulative: cum };
  });
}

export function countInRange(dates: string[], from: Date, to: Date) {
  let n = 0;
  for (const iso of dates) {
    const d = parseISO(iso);
    if (d >= from && d <= to) n++;
  }
  return n;
}

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export { addDays };

export function customRange(from: Date, to: Date, granularity: Granularity, label: string): ResolvedRange {
  const spanDays = Math.max(1, differenceInCalendarDays(to, from) + 1);
  const prevTo = endOfDay(subDays(from, 1));
  const prevFrom = startOfDay(subDays(from, spanDays));
  return { from, to, label, granularity, prevFrom, prevTo, prevLabel: `${format(prevFrom, "d MMM yyyy")} – ${format(prevTo, "d MMM yyyy")}` };
}
