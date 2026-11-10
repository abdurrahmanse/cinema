import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";
import { categoryMeta } from "../categories";
import { getMovies } from "../services/movie-service";
import type { MovieCategory } from "../types";
import { MovieGrid } from "./movie-grid";

export async function MovieSection({
  category,
  limit = 10,
  eyebrow,
}: {
  category: MovieCategory;
  limit?: number;
  eyebrow?: string;
}) {
  const { results } = await getMovies(category, 1);
  return (
    <section className="py-16 md:py-20">
      <Container>
        <SectionHeading
          title={categoryMeta[category].title}
          eyebrow={eyebrow}
          href={category === "trending" ? undefined : `/movies/${category}`}
        />
        <MovieGrid movies={results.slice(0, limit)} />
      </Container>
    </section>
  );
}
