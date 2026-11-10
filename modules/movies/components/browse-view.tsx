import { Container } from "@/shared/ui/container";
import { Pagination } from "@/shared/ui/pagination";
import { categoryMeta } from "../categories";
import { hrefWith, parseFilters } from "../filters";
import { filterBounds, filterCountries, filterLanguages, getGenres, getMovies, providerInfo } from "../services/movie-service";
import type { Genre, MovieCategory } from "../types";
import { FilterBar } from "./filter-bar";
import { LiveRefresh } from "./live-refresh";
import { SearchHero } from "./search-hero";
import { MovieGrid } from "./movie-grid";

export async function BrowseView({
  category,
  searchParams,
  showSearch = false,
  genre,
}: {
  category: MovieCategory;
  showSearch?: boolean;
  /** Locks the view to one genre (dedicated genre page) */
  genre?: Genre;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const genres = await getGenres();
  const parsed = parseFilters(sp, genres, filterBounds, filterLanguages, filterCountries);
  // On a genre page the genre lives in the path, not the query string
  const filters = genre ? { ...parsed, genres: [] } : parsed;
  const data = await getMovies(category, page, genre ? { ...filters, genres: [genre.id] } : filters);

  const basePath = genre ? `/genre/${genre.slug}` : category === "latest" ? "/" : `/movies/${category}`;
  const { title, blurb } = genre
    ? { title: genre.name, blurb: `The best of ${genre.name.toLowerCase()}, updated automatically.` }
    : categoryMeta[category];

  return (
    <>
    {showSearch && <SearchHero />}
    <Container className={showSearch ? "pb-24 pt-16" : "pb-24 pt-28 md:pt-32"}>
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          {genre && <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-primary">Genre</p>}
          <h1 className="font-serif text-5xl md:text-6xl">{title}</h1>
          <p className="mt-3 text-muted-foreground">{blurb}</p>
        </div>
        <LiveRefresh />
      </header>

      <FilterBar
        basePath={basePath}
        lockedGenre={Boolean(genre)}
        category={category}
        categories={providerInfo.categories}
        genres={genres}
        languages={filterLanguages}
        countries={filterCountries}
        bounds={filterBounds}
        filters={filters}
      />

      <MovieGrid movies={data.results} />
      <Pagination page={data.page} totalPages={data.totalPages} hrefFor={(p) => hrefWith(basePath, filters, p)} />
    </Container>
    </>
  );
}
