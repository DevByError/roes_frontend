import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const nf = new Intl.NumberFormat("en-US");
export const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
export const money = new Intl.NumberFormat("en-MY", {
  style: "currency",
  currency: "MYR",
  maximumFractionDigits: 0,
});

export function fmtDate(iso: string | Date, pattern = "d MMM yyyy") {
  return format(typeof iso === "string" ? parseISO(iso) : iso, pattern);
}

export function fmtDateTime(iso: string | Date) {
  return format(typeof iso === "string" ? parseISO(iso) : iso, "d MMM yyyy, HH:mm");
}

export function timeAgo(iso: string | Date) {
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  const s = formatDistanceToNowStrict(d, { addSuffix: true });
  return s.replace(/ seconds?/, "s").replace(/ minutes?/, "m").replace(/ hours?/, "h").replace(/ days?/, "d");
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const AVATAR_TONES = [
  ["#e9f0f7", "#2665ae"],
  ["#e3f3f0", "#0b6b57"],
  ["#ffeee8", "#8a3a1a"],
  ["#ecebf3", "#4d4c78"],
  ["#d4d3e3", "#1b2433"],
  ["#e3f3f0", "#1f4f8c"],
  ["#ffeee8", "#1b2433"],
  ["#e9f0f7", "#4d4c78"],
] as const;

export function avatarTone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

export function maskId(id: string) {
  return id.length <= 4 ? id : "•".repeat(Math.max(id.length - 4, 0)) + id.slice(-4);
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
