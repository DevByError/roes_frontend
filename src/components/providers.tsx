"use client";

import { useEffect } from "react";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useApp } from "@/store/app-store";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-right"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border !bg-popover !text-foreground !shadow-[var(--shadow-pop)] !font-sans",
          description: "!text-muted-foreground",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useApp.getState().init();
  }, []);

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        <ThemedToaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
