import { getMovies } from "../services/movie-service";
import { Billboard } from "./billboard";

async function loadFeatured() {
  try {
    const { results } = await getMovies("movies", "trending", 1);
    const picks = [...results.filter((m) => m.overview && m.backdropPath), ...results.filter((m) => m.overview && !m.backdropPath)];
    return [...new Map(picks.map((m) => [m.id, m])).values()].slice(0, 5);
  } catch (err) {
    console.error("[billboard] failed", err);
    return [];
  }
}

export async function BillboardSection() {
  const featured = await loadFeatured();
  return featured.length ? <Billboard movies={featured} /> : <div className="h-24" />;
}

export function BillboardSkeleton() {
  return <div className="h-[82vh] min-h-[560px] animate-pulse bg-gradient-to-b from-secondary to-background lg:h-[90vh]" aria-hidden />;
}
