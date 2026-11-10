import { Suspense } from "react";
import { Hero } from "@/modules/movies/components/hero";
import { MovieSection } from "@/modules/movies/components/movie-section";
import { MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { GenreFilter, GenreFilterSkeleton } from "@/modules/movies/components/genre-filter";
import { getMovies, providerInfo } from "@/modules/movies/services/movie-service";
import { Skeleton } from "@/shared/ui/skeleton";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";
import type { MovieCategory } from "@/modules/movies/types";

async function FeaturedHero() {
  const { results } = await getMovies("trending", 1);
  const featured = results.find((m) => m.backdropPath && m.overview) ?? results[0];
  return featured ? <Hero movie={featured} /> : null;
}

function SectionFallback() {
  return (
    <section className="py-16 md:py-20">
      <Container>
        <MovieGridSkeleton />
      </Container>
    </section>
  );
}

const sections: { category: MovieCategory; eyebrow: string }[] = [
  { category: "latest", eyebrow: "Just in" },
  { category: "upcoming", eyebrow: "On the horizon" },
  { category: "top-rated", eyebrow: "Timeless" },
  { category: "popular", eyebrow: "Audience favourites" },
];

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<Skeleton className="min-h-[78vh] border-b border-border" />}>
        <FeaturedHero />
      </Suspense>

      <section className="pt-16 md:pt-20">
        <Container>
          <SectionHeading title="Browse by genre" eyebrow="Explore" />
          <Suspense fallback={<GenreFilterSkeleton />}>
            <GenreFilter basePath="/movies/popular" />
          </Suspense>
        </Container>
      </section>

      {sections
        .filter((s) => providerInfo.categories.includes(s.category))
        .map((s) => (
          <Suspense key={s.category} fallback={<SectionFallback />}>
            <MovieSection category={s.category} eyebrow={s.eyebrow} />
          </Suspense>
        ))}
    </>
  );
}
