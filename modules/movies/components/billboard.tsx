"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { Info, Play, Star } from "lucide-react";
import { SaveButton } from "@/modules/library/save-button";
import { releaseYear } from "@/shared/lib/format";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { imageUrl, isOptimizable } from "../image";
import type { Movie } from "../types";

export function Billboard({ movies }: { movies: Movie[] }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, duration: 30 }, [
    Autoplay({ delay: 8000, stopOnInteraction: false, stopOnMouseEnter: true }),
  ]);
  const [index, setIndex] = useState(0);

  const onSelect = useCallback(() => embla && setIndex(embla.selectedScrollSnap()), [embla]);
  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  return (
    <section aria-roledescription="carousel" aria-label="Featured titles" className="relative">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {movies.map((m, i) => {
            const backdrop = imageUrl(m.backdropPath, "w1280");
            const poster = imageUrl(m.posterPath, "w500");
            const lowRes = backdrop ? !isOptimizable(backdrop) : false;
            const href = `/${m.kind}/${encodeURIComponent(m.id)}`;
            return (
              <article key={`${m.kind}:${m.id}`} className="relative isolate min-h-[560px] min-w-0 flex-[0_0_100%] h-[82vh] lg:h-[90vh]">
                {backdrop && (
                  <Image
                    src={backdrop}
                    alt=""
                    fill
                    priority={i === 0}
                    sizes="100vw"
                    unoptimized={lowRes}
                    className={cn("-z-20 object-cover", lowRes && "scale-125 opacity-60 blur-2xl")}
                  />
                )}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/30 to-background/20" />
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/55 to-transparent" />

                {lowRes && poster && (
                  <div className="absolute bottom-28 right-[8%] hidden w-60 md:block lg:w-72">
                    <div className="relative aspect-[2/3] overflow-hidden rounded-xl shadow-2xl shadow-black/70 ring-1 ring-white/15">
                      <Image src={poster} alt={`${m.title} poster`} fill sizes="288px" unoptimized className="object-cover" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 px-4 pb-20 md:px-10 md:pb-28">
                  <div className="max-w-2xl">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex size-6 items-center justify-center rounded-sm bg-primary text-[10px] font-extrabold text-white">C</span>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                        {m.kind === "tv" ? "Series" : "Film"} · #{i + 1} Trending
                      </span>
                    </div>
                    <h1 className="font-display text-4xl font-extrabold leading-[1.05] drop-shadow-lg md:text-6xl lg:text-7xl">{m.title}</h1>
                    <div className="mt-4 flex items-center gap-4 text-sm font-medium text-white/85">
                      {m.rating > 0 && (
                        <span className="flex items-center gap-1 text-rating">
                          <Star className="size-4 fill-current" /> {m.rating.toFixed(1)}
                        </span>
                      )}
                      <span>{releaseYear(m.releaseDate)}</span>
                    </div>
                    {m.overview && <p className="mt-5 line-clamp-3 max-w-xl text-base leading-relaxed text-white/80 md:text-lg">{m.overview}</p>}
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                      <Button asChild variant="light" size="lg">
                        <Link href={`${href}#watch`}>
                          <Play className="fill-current" /> Play
                        </Link>
                      </Button>
                      <Button asChild variant="glass" size="lg">
                        <Link href={href}>
                          <Info /> More info
                        </Link>
                      </Button>
                      <SaveButton
                        item={{ id: m.id, kind: m.kind, title: m.title, posterPath: m.posterPath, releaseDate: m.releaseDate, rating: m.rating }}
                        className="size-12 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-24 right-4 z-10 flex gap-2 md:bottom-28 md:right-10">
        {movies.map((m, i) => (
          <button
            key={m.id}
            type="button"
            aria-label={`Show ${m.title}`}
            aria-current={i === index}
            onClick={() => embla?.scrollTo(i)}
            className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-8 bg-primary" : "w-4 bg-white/35 hover:bg-white/60")}
          />
        ))}
      </div>
    </section>
  );
}
