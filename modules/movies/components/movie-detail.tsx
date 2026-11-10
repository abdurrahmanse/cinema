import Image from "next/image";
import { Container } from "@/shared/ui/container";
import { SectionHeading } from "@/shared/ui/section-heading";
import { formatDate, formatRuntime } from "@/shared/lib/format";
import { imageUrl } from "../image";
import type { MovieDetail as MovieDetailType } from "../types";
import { MovieGrid } from "./movie-grid";
import { Poster } from "./poster";

export function MovieDetail({ movie }: { movie: MovieDetailType }) {
  const backdrop = imageUrl(movie.backdropPath, "w1280");
  const runtime = formatRuntime(movie.runtime);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-line">
        {backdrop && <Image src={backdrop} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-35" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <Container className="grid gap-10 pb-16 pt-36 md:grid-cols-[300px_1fr] md:gap-16 md:pb-24 md:pt-44">
          <div className="mx-auto w-56 md:w-full">
            <Poster path={movie.posterPath} title={movie.title} sizes="300px" priority />
          </div>
          <div>
            {movie.genres.length > 0 && (
              <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-accent">{movie.genres.join(" · ")}</p>
            )}
            <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">{movie.title}</h1>
            {movie.tagline && <p className="mt-4 font-serif text-xl italic text-muted">{movie.tagline}</p>}

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-line py-5 text-sm">
              <Fact label="Released" value={formatDate(movie.releaseDate)} />
              {runtime && <Fact label="Runtime" value={runtime} />}
              {movie.rating > 0 && <Fact label="Rating" value={`★ ${movie.rating.toFixed(1)} / 10`} accent />}
              {movie.directors.length > 0 && <Fact label="Director" value={movie.directors.join(", ")} />}
            </dl>

            <p className="mt-8 max-w-2xl text-base leading-[1.85] text-foreground/85">{movie.overview}</p>

            {movie.trailerKey && (
              <a
                href={`https://www.youtube.com/watch?v=${movie.trailerKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-block border border-accent px-8 py-3.5 text-xs uppercase tracking-[0.25em] text-accent transition-colors hover:bg-accent hover:text-background"
              >
                Watch trailer
              </a>
            )}
          </div>
        </Container>
      </section>

      {movie.trailerKey && (
        <section className="py-16 md:py-20">
          <Container>
            <SectionHeading title="Trailer" />
            <div className="aspect-video w-full max-w-4xl ring-1 ring-line">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${movie.trailerKey}`}
                title={`${movie.title} — trailer`}
                loading="lazy"
                allow="encrypted-media; picture-in-picture; fullscreen"
                className="h-full w-full"
              />
            </div>
          </Container>
        </section>
      )}

      {movie.cast.length > 0 && (
        <section className="py-16 md:py-20">
          <Container>
            <SectionHeading title="Cast" />
            <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {movie.cast.map((person) => (
                <li key={person.id} className="border-l border-accent/60 pl-4">
                  <p className="font-serif text-lg leading-snug">{person.name}</p>
                  <p className="text-xs tracking-[0.1em] text-muted">{person.character}</p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {movie.similar.length > 0 && (
        <section className="py-16 md:py-20">
          <Container>
            <SectionHeading title="You may also like" />
            <MovieGrid movies={movie.similar.slice(0, 5)} />
          </Container>
        </section>
      )}
    </>
  );
}

function Fact({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <dt className="mb-1 text-[10px] uppercase tracking-[0.25em] text-muted">{label}</dt>
      <dd className={accent ? "text-accent" : ""}>{value}</dd>
    </div>
  );
}
