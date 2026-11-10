import Image from "next/image";
import { Play } from "lucide-react";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";
import { Separator } from "@/shared/ui/separator";
import { SectionHeading } from "@/shared/ui/section-heading";
import { formatDate, formatRuntime } from "@/shared/lib/format";
import { imageUrl, isOptimizable } from "../image";
import type { MovieDetail as MovieDetailType } from "../types";
import { MovieGrid } from "./movie-grid";
import { Poster } from "./poster";
import { VideoPlayer } from "./video-player";

export function MovieDetail({ movie }: { movie: MovieDetailType }) {
  const backdrop = imageUrl(movie.backdropPath, "w1280");
  const runtime = formatRuntime(movie.runtime);

  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-border">
        {backdrop && <Image src={backdrop} alt="" fill priority sizes="100vw" unoptimized={!isOptimizable(backdrop)} className={`-z-20 object-cover opacity-35 ${isOptimizable(backdrop) ? "" : "scale-110 blur-xl"}`} />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <Container className="grid gap-10 pb-16 pt-36 md:grid-cols-[300px_1fr] md:gap-16 md:pb-24 md:pt-44">
          <div className="mx-auto w-56 md:w-full">
            <Poster path={movie.posterPath} title={movie.title} sizes="300px" priority />
          </div>
          <div>
            {movie.genres.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {movie.genres.map((g) => (
                  <Badge key={g} variant="gold">{g}</Badge>
                ))}
              </div>
            )}
            <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">{movie.title}</h1>
            {movie.tagline && <p className="mt-4 font-serif text-xl italic text-muted-foreground">{movie.tagline}</p>}

            <Separator className="mt-8" />
            <dl className="flex flex-wrap gap-x-10 gap-y-4 py-5 text-sm">
              <Fact label="Released" value={formatDate(movie.releaseDate)} />
              {runtime && <Fact label="Runtime" value={runtime} />}
              {movie.rating > 0 && <Fact label="Rating" value={`★ ${movie.rating.toFixed(1)} / 10`} accent />}
              {movie.directors.length > 0 && <Fact label="Director" value={movie.directors.join(", ")} />}
            </dl>
            <Separator />

            <p className="mt-8 max-w-2xl text-base leading-[1.85] text-foreground/85">{movie.overview}</p>

            {movie.playback && (
              <Button asChild variant="outline" className="mt-10">
                <a href="#watch">
                  <Play /> {movie.playback.kind === "youtube" ? "Watch trailer" : "Watch now"}
                </a>
              </Button>
            )}
          </div>
        </Container>
      </section>

      {movie.playback && (
        <section id="watch" className="scroll-mt-8 py-16 md:py-20">
          <Container>
            <SectionHeading title={movie.playback.label} eyebrow="Now showing" />
            <VideoPlayer playback={movie.playback} poster={backdrop} title={movie.title} />
          </Container>
        </section>
      )}

      {movie.cast.length > 0 && (
        <section className="py-16 md:py-20">
          <Container>
            <SectionHeading title="Cast" />
            <ul className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {movie.cast.map((person) => (
                <li key={person.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback>{person.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-serif text-lg leading-snug">{person.name}</p>
                    {person.character && <p className="text-xs tracking-[0.1em] text-muted-foreground">{person.character}</p>}
                  </div>
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
      <dt className="mb-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</dt>
      <dd className={accent ? "text-primary" : ""}>{value}</dd>
    </div>
  );
}
