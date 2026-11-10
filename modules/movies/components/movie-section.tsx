import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";
import { categoryMeta, type BrowsableCategory } from "../categories";
import { getMovies } from "../services/movie-service";
import { MovieGrid } from "./movie-grid";

export async function MovieSection({
  category,
  limit = 10,
  eyebrow,
}: {
  category: BrowsableCategory | "trending";
  limit?: number;
  eyebrow?: string;
}) {
  const { results } = await getMovies(category, 1);
  const { title } = categoryMeta[category];
  return (
    <section className="py-16 md:py-20">
      <Container>
        <SectionHeading
          title={title}
          eyebrow={eyebrow}
          href={category === "trending" ? undefined : `/movies/${category}`}
        />
        <MovieGrid movies={results.slice(0, limit)} />
      </Container>
    </section>
  );
}
