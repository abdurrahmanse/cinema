import { Suspense } from "react";
import type { Metadata } from "next";
import { MovieGrid, MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { SearchBox } from "@/modules/movies/components/search-box";
import { searchMovies } from "@/modules/movies/services/movie-service";
import { ErrorState } from "@/shared/ui/error-state";
import { Pagination } from "@/shared/ui/pagination";

export const metadata: Metadata = { title: "Search" };

async function runSearch(q: string, page: number) {
  try {
    return await searchMovies(q, page);
  } catch (err) {
    console.error("[search] failed", err);
    return null;
  }
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);

  if (!q) return <p className="text-lg text-muted-foreground">Type a title above to start searching.</p>;

  const data = await runSearch(q, page);
  if (!data) return <ErrorState title="Search is unavailable." retryHref={`/search?q=${encodeURIComponent(q)}`} />;

  return (
    <>
      <h1 className="mb-8 font-display text-3xl font-extrabold md:text-4xl">
        Results for <span className="text-primary">“{q}”</span>
      </h1>
      <MovieGrid movies={data.results} />
      <Pagination page={data.page} totalPages={data.totalPages} hrefFor={(p) => `/search?q=${encodeURIComponent(q)}&page=${p}`} />
    </>
  );
}

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="px-4 pb-24 pt-24 md:px-10 md:pt-28">
      <div className="mb-10 max-w-2xl">
        <SearchBox variant="hero" />
      </div>
      <Suspense fallback={<MovieGridSkeleton />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
