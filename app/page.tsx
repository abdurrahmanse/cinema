import { Suspense } from "react";
import { Hero } from "@/modules/movies/components/hero";
import { MovieSection } from "@/modules/movies/components/movie-section";
import { MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { getMovies } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";

async function FeaturedHero() {
  const { results } = await getMovies("trending", 1);
  const featured = results.find((m) => m.backdropPath) ?? results[0];
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

export default function HomePage() {
  return (
    <>
      <Suspense fallback={<div className="min-h-[78vh] border-b border-line bg-surface" />}>
        <FeaturedHero />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <MovieSection category="now-playing" eyebrow="In cinemas" />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <MovieSection category="upcoming" eyebrow="On the horizon" />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <MovieSection category="top-rated" eyebrow="Timeless" />
      </Suspense>
    </>
  );
}
