import { Suspense } from "react";
import type { Metadata } from "next";
import { MovieGrid, MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { searchMovies } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";
import { Pagination } from "@/shared/ui/pagination";

export const metadata: Metadata = { title: "Search" };

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Number(rawPage) || 1);

  if (!q) {
    return <p className="font-serif text-2xl text-muted-foreground">Type a title in the search box to begin.</p>;
  }
  const data = await searchMovies(q, page);
  return (
    <>
      <h1 className="mb-14 font-serif text-4xl md:text-5xl">
        Results for <span className="text-primary">“{q}”</span>
      </h1>
      <MovieGrid movies={data.results} />
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        hrefFor={(p) => `/search?q=${encodeURIComponent(q)}&page=${p}`}
      />
    </>
  );
}

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <Container className="pb-24 pt-40">
      <Suspense fallback={<MovieGridSkeleton />}>
        <Results searchParams={props.searchParams} />
      </Suspense>
    </Container>
  );
}
