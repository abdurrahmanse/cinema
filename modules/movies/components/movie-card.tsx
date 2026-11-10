import Link from "next/link";
import { releaseYear } from "@/shared/lib/format";
import type { Movie } from "../types";
import { Poster } from "./poster";

export function MovieCard({ movie, priority = false }: { movie: Movie; priority?: boolean }) {
  return (
    <Link href={`/movie/${movie.id}`} className="group block">
      <div className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
        <Poster path={movie.posterPath} title={movie.title} priority={priority} />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="font-serif text-lg leading-snug transition-colors group-hover:text-accent">{movie.title}</h3>
        <p className="text-xs tracking-[0.15em] text-muted">
          {releaseYear(movie.releaseDate)}
          {movie.rating > 0 && <span className="text-accent"> · ★ {movie.rating.toFixed(1)}</span>}
        </p>
      </div>
    </Link>
  );
}
