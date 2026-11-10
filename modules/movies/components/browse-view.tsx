import { ContinueWatching } from "@/modules/library/continue-watching";
import { Pagination } from "@/shared/ui/pagination";
import { ErrorState } from "@/shared/ui/error-state";
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

async function load(sectionId: SectionId, category: MovieCategory, sp: Record<string, string | string[] | undefined>) {
  try {
    const section = sections[sectionId];
    const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
    const genres = await getGenres(sectionId);
    const allowed = section.languageCodes;
    const languages = allowed ? filterLanguages.filter((l) => allowed.includes(l.code)) : filterLanguages;
    const filters = parseFilters(sp, genres, filterBounds, languages, filterCountries);
    const data = await getMovies(sectionId, category, page, filters);
    return { genres, languages, filters, data };
  } catch (err) {
    console.error(`[browse] ${sectionId}/${category} failed`, err);
    return null;
  }
}

export async function BrowseView({
  section: sectionId,
  category,
  searchParams,
}: {
  section: SectionId;
  category: MovieCategory;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const section = sections[sectionId];
  const basePath = sectionHref(sectionId, category);
  const loaded = await load(sectionId, category, await searchParams);

  if (!loaded) {
    return (
      <div className="px-4 pb-24 pt-28 md:px-10">
        <ErrorState
          title="We couldn’t load the titles."
          message="The film service isn’t responding right now. This usually clears up in a moment."
          retryHref={basePath}
        />
      </div>
    );
  }
  const { genres, languages, filters, data } = loaded;

  return (
    <div className="px-4 pb-24 pt-24 md:px-10 md:pt-28">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-semibold text-primary">{categoryMeta[category].title}</p>
          <h1 className="font-display text-4xl font-extrabold md:text-5xl">{section.title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{section.blurb}</p>
        </div>
        <LiveRefresh />
      </header>

      <ContinueWatching />

      <FilterBar
        section={section}
        category={category}
        categories={categoriesFor(sectionId)}
        genres={genres}
        languages={languages}
        countries={filterCountries}
        bounds={filterBounds}
        filters={filters}
      />

      <MovieGrid movies={data.results} />
      <Pagination page={data.page} totalPages={data.totalPages} hrefFor={(p) => hrefWith(basePath, filters, p)} />
    </div>
  );
}
