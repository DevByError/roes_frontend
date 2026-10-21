"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UserCircle2 } from "lucide-react";
import { NAV } from "./nav";
import { Logo, Wordmark } from "./logo";
import { MayorAvatar } from "@/components/domain/person";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

const GROUPS = ["Overview", "People", "Community"] as const;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const mayor = useApp((s) => s.mayor);
  const logout = useApp((s) => s.logout);
  const openComplaints = useApp((s) => s.complaints.filter((c) => c.status === "new").length);
  const pendingUsers = useApp((s) => s.users.filter((u) => u.status === "pending").length);

  const badge = (href: string) => {
    if (href === "/complaints" && openComplaints) return { n: openComplaints, tone: "gold" as const };
    if (href === "/users" && pendingUsers) return { n: pendingUsers, tone: "muted" as const };
    return null;
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 pb-4 pt-6">
        <Logo size={38} />
        <Wordmark />
      </div>

      <nav aria-label="Main" className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {GROUPS.map((g) => (
          <div key={g}>
            <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50">{g}</p>
            <ul className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const b = badge(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-accent",
                        active ? "bg-white/10 text-sidebar-active dark:bg-primary/15" : "hover:bg-white/5 hover:text-sidebar-active dark:hover:bg-primary/10",
                      )}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-sidebar-accent" />}
                      <item.icon className={cn("size-[18px] shrink-0 transition-colors", active ? "text-sidebar-accent" : "text-sidebar-foreground/70 group-hover:text-sidebar-active")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {b && (
                        <span
                          className={cn(
                            "tabular min-w-5 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold",
                            b.tone === "gold" ? "bg-accent text-accent-foreground" : "bg-white/10 text-sidebar-foreground",
                          )}
                        >
                          {b.n}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg p-2 outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-sidebar-accent"
        >
          <MayorAvatar size={38} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-sidebar-active">{mayor.name}</span>
            <span className="block truncate text-xs text-sidebar-foreground/70">Mayor · {mayor.city}</span>
          </span>
          <UserCircle2 className="size-4 text-sidebar-foreground/50" />
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 outline-none transition-colors hover:bg-white/5 hover:text-sidebar-active focus-visible:ring-2 focus-visible:ring-sidebar-accent"
        >
          <LogOut className="size-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  );
}
