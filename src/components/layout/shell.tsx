"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { SheetContent } from "@/components/ui/dialog";
import { SidebarNav } from "./sidebar";
import { Topbar } from "./topbar";
import { Splash } from "./splash";
import { useApp } from "@/store/app-store";

export function Shell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useApp((s) => s.hydrated);
  const session = useApp((s) => s.session);
  const refresh = useApp((s) => s.refresh);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [live, setLive] = useState(true);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (hydrated && !session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [hydrated, session, router, pathname]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    if (!hydrated || !session || !live) return;
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      const fresh = await refresh();
      for (const ev of fresh.slice(0, 3)) toast(ev.text, { description: "Just now", duration: 4500 });
    };
    const timer = setInterval(tick, 15000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, [hydrated, session, live, refresh]);

  if (!hydrated || !session) return <Splash />;

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17rem] border-r border-sidebar-border lg:block">
        <SidebarNav />
      </aside>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" title="Navigation" className="max-w-[18rem] border-sidebar-border p-0">
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Dialog>

      <div className="lg:pl-[17rem]">
        <Topbar onMenu={() => setMobileOpen(true)} live={live} onToggleLive={() => setLive((v) => !v)} />
        <main ref={mainRef} className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
