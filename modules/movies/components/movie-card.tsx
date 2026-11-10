import Link from "next/link";
import { Play, Star } from "lucide-react";
import { SaveButton } from "@/modules/library/save-button";
import { releaseYear } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import type { Movie } from "../types";
import { Poster } from "./poster";

export function MovieCard({ movie, priority = false, className }: { movie: Movie; priority?: boolean; className?: string }) {
  return (
    <div className={cn("group relative", className)}>
      <Link href={`/${movie.kind}/${encodeURIComponent(movie.id)}`} className="block" title={movie.title}>
        <div className="relative overflow-hidden rounded-lg ring-1 ring-white/10 transition-all duration-300 ease-out group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/70 group-hover:ring-white/30">
          <Poster path={movie.posterPath} title={movie.title} priority={priority} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute inset-0 m-auto flex size-12 scale-75 items-center justify-center rounded-full bg-primary text-white opacity-0 shadow-lg shadow-primary/40 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
            <Play className="size-5 translate-x-px fill-current" />
          </span>
          {movie.rating > 0 && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md">
              <Star className="size-3 fill-rating text-rating" /> {movie.rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="mt-3 px-0.5">
          <h3 className="truncate text-sm font-semibold leading-snug transition-colors group-hover:text-primary">{movie.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {releaseYear(movie.releaseDate)} · {movie.kind === "tv" ? "Series" : "Movie"}
          </p>
        </div>
      </Link>
      <SaveButton
        item={{
          id: movie.id,
          kind: movie.kind,
          title: movie.title,
          posterPath: movie.posterPath,
          releaseDate: movie.releaseDate,
          rating: movie.rating,
        }}
        className="absolute right-2 top-2 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      />
    </div>
  );
}
