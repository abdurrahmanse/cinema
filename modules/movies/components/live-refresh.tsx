"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 5 * 60 * 1000;

/** Re-fetches the page's server data on an interval and when the tab regains focus. */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      last = Date.now();
      router.refresh();
    };
    const timer = setInterval(refresh, INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - last > INTERVAL_MS) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
      </span>
      Live · updates automatically
    </span>
  );
}
