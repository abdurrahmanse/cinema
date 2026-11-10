import { Container } from "@/shared/ui/container";
import { SearchBox } from "./search-box";

export function SearchHero() {
  return (
    <section className="border-b border-border pb-16 pt-32 md:pb-20 md:pt-40">
      <Container className="flex flex-col items-center text-center">
        <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-primary">Search the library</p>
        <h1 className="mb-10 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">Find any film.</h1>
        <SearchBox variant="hero" />
        <p className="mt-6 text-xs tracking-[0.18em] text-muted-foreground">
          Searches every title across all collections and genres.
        </p>
      </Container>
    </section>
  );
}
