import { isDemoMode } from "@/modules/movies/services/movie-service";

export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <div className="relative z-40 border-b border-accent/40 bg-surface px-6 py-2 text-center text-[11px] uppercase tracking-[0.2em] text-accent">
      Demo data — set MOVIE_API_TOKEN in .env.local to load live films
    </div>
  );
}
