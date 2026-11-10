import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { browsableCategories, categoryMeta, isBrowsableCategory } from "@/modules/movies/categories";
import { MovieGrid, MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { getMovies } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";
import { Pagination } from "@/shared/ui/pagination";

export function generateStaticParams() {
  return browsableCategories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/movies/[category]">): Promise<Metadata> {
  const { category } = await params;
  return isBrowsableCategory(category) ? { title: categoryMeta[category].title } : {};
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/movies/[category]">, "params" | "searchParams">) {
  const { category } = await params;
  if (!isBrowsableCategory(category)) notFound();
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number(Array.isArray(rawPage) ? rawPage[0] : rawPage) || 1);
  const { title, blurb } = categoryMeta[category];
  const data = await getMovies(category, page);

  return (
    <>
      <header className="mb-14">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-accent">Collection</p>
        <h1 className="font-serif text-5xl md:text-6xl">{title}</h1>
        <p className="mt-4 text-muted">{blurb}</p>
      </header>
      <MovieGrid movies={data.results} />
      <Pagination page={data.page} totalPages={data.totalPages} hrefFor={(p) => `/movies/${category}?page=${p}`} />
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
