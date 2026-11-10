import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovie } from "../services/movie-service";
import type { ItemKind } from "../types";
import { MovieDetail } from "./movie-detail";

export async function movieMetadata(kind: ItemKind, params: Promise<{ id: string }>): Promise<Metadata> {
  const { id } = await params;
  const movie = await getMovie(kind, id);
  return movie ? { title: movie.title, description: movie.overview } : {};
}

export async function MoviePageContent({ kind, params }: { kind: ItemKind; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const movie = await getMovie(kind, id);
  if (!movie) notFound();
  return <MovieDetail movie={movie} />;
}
