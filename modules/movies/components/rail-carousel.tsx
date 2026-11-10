"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Movie } from "../types";
import { MovieCard } from "./movie-card";

export function RailCarousel({
  title,
  href,
  movies,
  ranked = false,
  className,
}: {
  title: string;
  href?: string;
  movies: Movie[];
  ranked?: boolean;
  className?: string;
}) {
  const [emblaRef, embla] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true, slidesToScroll: "auto" });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const sync = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", sync).on("reInit", sync).on("scroll", sync);
    const raf = requestAnimationFrame(sync); // initial state, outside the effect body
    return () => {
      cancelAnimationFrame(raf);
      embla.off("select", sync).off("reInit", sync).off("scroll", sync);
    };
  }, [embla, sync]);

  const slide = ranked
    ? "basis-[62%] sm:basis-[40%] md:basis-[30%] lg:basis-[23%] xl:basis-[19%]"
    : "basis-[42%] sm:basis-[30%] md:basis-[23%] lg:basis-[18%] xl:basis-[14.2%]";

  return (
    <section className={cn("group/rail relative py-4", className)} aria-label={title}>
      <div className="mb-3 flex items-end justify-between gap-4 px-4 md:px-10">
        <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            See all <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden px-4 md:px-10">
          <ul className="-ml-3 flex touch-pan-y md:-ml-4">
            {movies.map((m, i) => (
              <li key={`${m.kind}:${m.id}`} className={cn("min-w-0 shrink-0 grow-0 pl-3 md:pl-4", slide)}>
                {ranked ? (
                  <div className="relative flex items-end">
                    <span
                      aria-hidden
                      className="-mr-5 -mb-2 select-none font-display text-[7rem] font-extrabold leading-none text-transparent sm:text-[9rem]"
                      style={{ WebkitTextStroke: "3px rgb(255 255 255 / 0.28)" }}
                    >
                      {i + 1}
                    </span>
                    <MovieCard movie={m} className="relative z-10 w-[62%] shrink-0" />
                  </div>
                ) : (
                  <MovieCard movie={m} />
                )}
              </li>
            ))}
          </ul>
        </div>

        {(["prev", "next"] as const).map((dir) => {
          const enabled = dir === "prev" ? canPrev : canNext;
          return (
            <button
              key={dir}
              type="button"
              aria-label={dir === "prev" ? "Scroll left" : "Scroll right"}
              disabled={!enabled}
              onClick={() => (dir === "prev" ? embla?.scrollPrev() : embla?.scrollNext())}
              className={cn(
                "absolute top-0 z-20 hidden h-[calc(100%-3.5rem)] w-12 items-center justify-center bg-gradient-to-r from-background/90 to-transparent text-white opacity-0 transition-opacity md:flex",
                dir === "prev" ? "left-0" : "right-0 rotate-180",
                enabled && "group-hover/rail:opacity-100",
              )}
            >
              <ChevronLeft className="size-8 drop-shadow" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function RailSkeleton({ title }: { title?: string }) {
  return (
    <div className="px-4 py-4 md:px-10" aria-hidden>
      <div className="mb-3 h-6 w-48 animate-pulse rounded-md bg-white/[0.06]">{title && <span className="sr-only">{title}</span>}</div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="w-[42%] shrink-0 sm:w-[30%] md:w-[23%] lg:w-[18%] xl:w-[14.2%]">
            <div className="aspect-[2/3] animate-pulse rounded-lg bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}
