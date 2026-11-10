import type { Movie } from "../types";
import { MovieCard } from "./movie-card";

export function MovieGrid({ movies }: { movies: Movie[] }) {
  if (movies.length === 0) {
    return <p className="py-24 text-center font-serif text-2xl text-muted">No films found.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}

export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="aspect-[2/3] animate-pulse bg-surface" />
          <div className="mt-4 h-4 w-3/4 animate-pulse bg-surface" />
          <div className="mt-2 h-3 w-1/3 animate-pulse bg-surface" />
        </div>
      ))}
    </div>
  );
}
