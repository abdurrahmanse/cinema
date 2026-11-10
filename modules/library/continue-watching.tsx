"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { imageUrl, isOptimizable } from "@/modules/movies/image";
import { formatClock } from "@/shared/lib/format";
import { clearProgress, useHistory } from "./store";

export function ContinueWatching() {
  const history = useHistory();
  if (history.length === 0) return null;

  return (
    <section className="py-4" aria-label="Continue watching">
      <h2 className="mb-3 px-4 font-display text-xl font-bold md:px-10 md:text-2xl">Continue watching</h2>
      <ul className="scrollbar-none flex gap-4 overflow-x-auto px-4 pb-2 md:px-10">
        {history.map((h) => {
          const src = imageUrl(h.posterPath, "w342");
          const pct = Math.min(100, (h.position / h.duration) * 100);
          return (
            <li key={`${h.kind}:${h.id}`} className="group relative w-40 shrink-0 sm:w-44">
              <Link href={`/${h.kind}/${encodeURIComponent(h.id)}#watch`} className="block">
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-card ring-1 ring-white/10 transition-all group-hover:-translate-y-1 group-hover:ring-white/30">
                  {src && <Image src={src} alt="" fill sizes="176px" unoptimized={!isOptimizable(src)} className="object-cover" />}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/25">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <p className="mt-3 truncate text-sm font-semibold transition-colors group-hover:text-primary">{h.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatClock(h.position)} / {formatClock(h.duration)}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => clearProgress(h)}
                aria-label={`Remove ${h.title} from continue watching`}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/70 text-white/80 opacity-0 transition-opacity hover:text-primary focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
