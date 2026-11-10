import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MovieDetail } from "@/modules/movies/components/movie-detail";
import { getMovie } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";

export async function generateMetadata({ params }: PageProps<"/movie/[id]">): Promise<Metadata> {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) return {};
  const movie = await getMovie(id);
  return movie ? { title: movie.title, description: movie.overview } : {};
}

async function MovieContent({ params }: Pick<PageProps<"/movie/[id]">, "params">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const movie = await getMovie(id);
  if (!movie) notFound();
  return <MovieDetail movie={movie} />;
}

export default function MoviePage(props: PageProps<"/movie/[id]">) {
  return (
    <Suspense fallback={<Container className="pt-44"><div className="h-[60vh] animate-pulse bg-surface" /></Container>}>
      <MovieContent params={props.params} />
    </Suspense>
  );
}
