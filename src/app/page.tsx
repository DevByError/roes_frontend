"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/store/app-store";
import { Splash } from "@/components/layout/splash";

export default function Home() {
  const router = useRouter();
  const hydrated = useApp((s) => s.hydrated);
  const session = useApp((s) => s.session);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(session ? "/dashboard" : "/login");
  }, [hydrated, session, router]);

  return <Splash />;
}
