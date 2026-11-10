import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { getGenres } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";
import { Skeleton } from "@/shared/ui/skeleton";

export const metadata: Metadata = { title: "Genres" };

async function GenreIndex() {
  const genres = await getGenres();
  return (
    <ul className="grid grid-cols-1 border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
      {genres.map((g, i) => (
        <li key={g.id} className="border-b border-r border-border">
          <Link
            href={`/genre/${g.slug}`}
            className="group flex h-full min-h-32 items-end justify-between gap-4 p-6 transition-colors hover:bg-card"
          >
            <span>
              <span className="mb-2 block text-[10px] tabular-nums tracking-[0.3em] text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-serif text-3xl leading-tight transition-colors group-hover:text-primary md:text-4xl">
                {g.name}
              </span>
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function GenresPage() {
  return (
    <Container className="pb-24 pt-28 md:pt-32">
      <header className="mb-12">
        <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-primary">Browse</p>
        <h1 className="font-serif text-5xl md:text-6xl">All genres</h1>
        <p className="mt-3 text-muted-foreground">Pick a genre to see its own page, with filters for year, rating and more.</p>
      </header>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <GenreIndex />
      </Suspense>
    </Container>
  );
}
