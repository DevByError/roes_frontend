"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Menu, Moon, Radio, Sun, UserCircle2, LogOut, Settings2, Megaphone, MessageSquareWarning, UserPlus, HeartHandshake, ShieldCheck, UserCog } from "lucide-react";
import { MayorAvatar } from "@/components/domain/person";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/tooltip";
import { cn, timeAgo } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { ActivityItem } from "@/lib/types";

const KIND_ICON: Record<ActivityItem["kind"], typeof Bell> = {
  user: UserPlus,
  complaint: MessageSquareWarning,
  admin: UserCog,
  donation: HeartHandshake,
  policy: ShieldCheck,
  announcement: Megaphone,
};

export function Topbar({
  onMenu,
  live,
  onToggleLive,
}: {
  onMenu: () => void;
  live: boolean;
  onToggleLive: () => void;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const mayor = useApp((s) => s.mayor);
  const activity = useApp((s) => s.activity);
  const unread = useApp((s) => s.unreadActivity);
  const clearUnread = useApp((s) => s.clearUnread);
  const logout = useApp((s) => s.logout);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl sm:gap-3 sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={onMenu}>
        <Menu />
      </Button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Tooltip content={live ? "Live updates are on — click to pause" : "Live updates paused — click to resume"}>
          <button
            type="button"
            onClick={onToggleLive}
            aria-pressed={live}
            className={cn(
              "flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors",
              live ? "border-success/30 bg-success-soft text-success-ink" : "bg-card text-muted-foreground",
            )}
          >
            <span className="relative grid size-2 place-items-center">
              {live && <span className="absolute inline-flex size-2 animate-ping-slow rounded-full bg-success/70" />}
              <span className={cn("relative size-2 rounded-full", live ? "bg-success" : "bg-muted-foreground/50")} />
            </span>
            <span className="hidden sm:inline">{live ? "Live" : "Paused"}</span>
            <Radio className="size-3.5 sm:hidden" />
          </button>
        </Tooltip>

        <Tooltip content={resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"}>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="hidden dark:block" />
            <Moon className="dark:hidden" />
          </Button>
        </Tooltip>

        <DropdownMenu onOpenChange={(o) => o && clearUnread()}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Notifications${unread ? `, ${unread} new` : ""}`} className="relative">
              <Bell />
              {unread > 0 && (
                <span className="tabular absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-accent-foreground ring-2 ring-background">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[min(92vw,22rem)] p-0">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-sm font-semibold">Recent activity</p>
              <span className="text-xs text-muted-foreground">Across {mayor.city}</span>
            </div>
            <DropdownMenuSeparator className="m-0" />
            <ul className="scrollbar-thin max-h-80 overflow-y-auto p-1.5">
              {activity.slice(0, 8).map((a) => {
                const Icon = KIND_ICON[a.kind];
                return (
                  <li key={a.id} className="flex gap-3 rounded-lg p-2.5 hover:bg-muted">
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-snug">{a.text}</span>
                      <span className="text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="ml-1 rounded-full outline-none ring-offset-2 ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MayorAvatar size={38} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <MayorAvatar size={40} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{mayor.name}</p>
                <p className="truncate text-xs text-muted-foreground">{mayor.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/profile")}>
              <UserCircle2 /> My profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/profile?tab=preferences")}>
              <Settings2 /> Preferences
            </DropdownMenuItem>
            <DropdownMenuLabel className="sr-only">Session</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onSelect={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
