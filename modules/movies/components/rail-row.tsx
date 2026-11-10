import { hrefWith } from "../filters";
import type { RailDef } from "../rails";
import { sectionHref } from "../sections";
import { getGenres, getMovies } from "../services/movie-service";
import { RailCarousel } from "./rail-carousel";

async function loadRail(def: RailDef) {
  try {
    const genre = def.genreSlugs ? (await getGenres(def.section)).find((g) => def.genreSlugs!.includes(g.slug)) : undefined;
    if (def.genreSlugs && !genre) return null;
    const filters = { genres: genre ? [genre.id] : [], language: def.language };
    const data = await getMovies(def.section, def.category, 1, filters);
    return data.results.length >= 4 ? { filters, movies: data.results } : null;
  } catch (err) {
    console.error(`[rail:${def.id}] failed`, err);
    return null;
  }
}

/** One home-page row. Renders nothing if the source can't serve it, so rows never show up empty. */
export async function RailRow({ def }: { def: RailDef }) {
  const loaded = await loadRail(def);
  if (!loaded) return null;
  return (
    <RailCarousel
      title={def.title}
      ranked={def.ranked}
      movies={loaded.movies.slice(0, def.ranked ? 10 : 18)}
      href={def.category === "trending" ? undefined : hrefWith(sectionHref(def.section, def.category), loaded.filters)}
    />
  );
}
