import { Film } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import type { Movie } from "../types";
import { MovieCard } from "./movie-card";

const GRID = "grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

export function MovieGrid({ movies }: { movies: Movie[] }) {
  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-24 text-center">
        <Film className="size-9 text-muted-foreground" />
        <p className="font-display text-2xl font-bold">No titles match these filters.</p>
        <p className="text-sm text-muted-foreground">Try removing a filter or widening the year range.</p>
      </div>
    );
  }
  return (
    <div className={GRID}>
      {movies.map((movie, i) => (
        <MovieCard key={`${movie.kind}:${movie.id}`} movie={movie} priority={i < 6} />
      ))}
    </div>
  );
}

export function MovieGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className={GRID} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[2/3]" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
