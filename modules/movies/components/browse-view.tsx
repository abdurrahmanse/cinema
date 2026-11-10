import { Container } from "@/shared/ui/container";
import { Pagination } from "@/shared/ui/pagination";
import { categoryMeta } from "../categories";
import { hrefWith, parseFilters } from "../filters";
import { sectionHref, sections } from "../sections";
import {
  categoriesFor, filterBounds, filterCountries, filterLanguages, getGenres, getMovies,
} from "../services/movie-service";
import type { MovieCategory, SectionId } from "../types";
import { FilterBar } from "./filter-bar";
import { LiveRefresh } from "./live-refresh";
import { MovieGrid } from "./movie-grid";
import { SearchHero } from "./search-hero";

export async function BrowseView({
  section: sectionId,
  category,
  searchParams,
  showSearch = false,
}: {
  section: SectionId;
  category: MovieCategory;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  showSearch?: boolean;
}) {
  const section = sections[sectionId];
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const genres = await getGenres(sectionId);
  const filters = parseFilters(sp, genres, filterBounds, filterLanguages, filterCountries);
  const data = await getMovies(sectionId, category, page, filters);
  const basePath = sectionHref(sectionId, category);
  const Heading = showSearch ? "h2" : "h1";

  return (
    <>
      {showSearch && <SearchHero />}
      <Container className={showSearch ? "pb-24 pt-16" : "pb-24 pt-28 md:pt-32"}>
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-primary">{categoryMeta[category].title}</p>
            <Heading className="font-serif text-5xl md:text-6xl">{section.title}</Heading>
            <p className="mt-3 text-muted-foreground">{section.blurb}</p>
          </div>
          <LiveRefresh />
        </header>

        <FilterBar
          section={section}
          category={category}
          categories={categoriesFor(sectionId)}
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
