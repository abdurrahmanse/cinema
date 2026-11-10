import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryMeta, isCategory } from "@/modules/movies/categories";
import { GenreFilter, GenreFilterSkeleton } from "@/modules/movies/components/genre-filter";
import { MovieGrid, MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { getGenres, getMovies, providerInfo } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";
import { Pagination } from "@/shared/ui/pagination";

export function generateStaticParams() {
  return providerInfo.categories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/movies/[category]">): Promise<Metadata> {
  const { category } = await params;
  return isCategory(category) ? { title: categoryMeta[category].title } : {};
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/movies/[category]">, "params" | "searchParams">) {
  const { category } = await params;
  if (!isCategory(category) || !providerInfo.categories.includes(category)) notFound();

  const sp = await searchParams;
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const genreParam = one(sp.genre);
  const genres = await getGenres();
  const genre = genres.find((g) => g.id === genreParam);

  const data = await getMovies(category, page, genre?.id);
  const basePath = `/movies/${category}`;
  const { title, blurb } = categoryMeta[category];

  return (
    <>
      <header className="mb-12">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-primary">{genre ? genre.name : "Collection"}</p>
        <h1 className="font-serif text-5xl md:text-6xl">{title}</h1>
        <p className="mt-4 text-muted-foreground">{blurb}</p>
      </header>
      <Suspense fallback={<GenreFilterSkeleton />}>
        <GenreFilter basePath={basePath} active={genre?.id} />
      </Suspense>
      <MovieGrid movies={data.results} />
      <Pagination
        page={data.page}
        totalPages={data.totalPages}
        hrefFor={(p) => `${basePath}?${genre ? `genre=${genre.id}&` : ""}page=${p}`}
      />
    </>
  );
}

export default function CategoryPage(props: PageProps<"/movies/[category]">) {
  return (
    <Container className="pb-24 pt-40">
      <Suspense fallback={<MovieGridSkeleton />}>
        <CategoryContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </Container>
  );
}
