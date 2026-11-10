import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BrowseView } from "@/modules/movies/components/browse-view";
import { MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { getGenres } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";

export async function generateMetadata({ params }: PageProps<"/genre/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const genre = (await getGenres()).find((g) => g.slug === slug);
  return genre ? { title: genre.name } : {};
}

async function GenreContent({ params, searchParams }: Pick<PageProps<"/genre/[slug]">, "params" | "searchParams">) {
  const { slug } = await params;
  const genre = (await getGenres()).find((g) => g.slug === slug);
  if (!genre) notFound();
  return <BrowseView category="popular" genre={genre} searchParams={searchParams} />;
}

export default function GenrePage(props: PageProps<"/genre/[slug]">) {
  return (
    <Suspense fallback={<Container className="pb-24 pt-32"><MovieGridSkeleton /></Container>}>
      <GenreContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
