import Image from "next/image";
import { Play, Star } from "lucide-react";
import { SaveButton } from "@/modules/library/save-button";
import { formatDate, formatRuntime, releaseYear } from "@/shared/lib/format";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { imageUrl, isOptimizable } from "../image";
import type { MovieDetail as MovieDetailType } from "../types";
import { MovieGrid } from "./movie-grid";
import { Poster } from "./poster";
import { VideoPlayer } from "./video-player";

export function MovieDetail({ movie }: { movie: MovieDetailType }) {
  const backdrop = imageUrl(movie.backdropPath, "w1280");
  const lowRes = backdrop ? !isOptimizable(backdrop) : false;
  const runtime = formatRuntime(movie.runtime);
  const saveItem = {
    id: movie.id,
    kind: movie.kind,
    title: movie.title,
    posterPath: movie.posterPath,
    releaseDate: movie.releaseDate,
    rating: movie.rating,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": movie.kind === "tv" ? "TVSeries" : "Movie",
    name: movie.title,
    description: movie.overview || undefined,
    image: backdrop ?? undefined,
    datePublished: movie.releaseDate ?? undefined,
    genre: movie.genres.length ? movie.genres : undefined,
    director: movie.directors.map((name) => ({ "@type": "Person", name })),
    aggregateRating:
      movie.rating > 0 && movie.voteCount > 0
        ? { "@type": "AggregateRating", ratingValue: movie.rating.toFixed(1), bestRating: 10, ratingCount: movie.voteCount }
        : undefined,
  };

  const facts: [string, string][] = [
    ["Released", formatDate(movie.releaseDate)],
    ...(runtime ? ([["Runtime", runtime]] as [string, string][]) : []),
    ...(movie.status ? ([["Status", movie.status]] as [string, string][]) : []),
    ...(movie.directors.length ? ([[movie.kind === "tv" ? "Created by" : "Director", movie.directors.join(", ")]] as [string, string][]) : []),
    ...(movie.genres.length ? ([["Genres", movie.genres.map((g) => g.charAt(0).toUpperCase() + g.slice(1)).join(", ")]] as [string, string][]) : []),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* Hero */}
      <section className="relative isolate flex min-h-[74vh] items-end overflow-hidden">
        {backdrop && (
          <Image
            src={backdrop}
            alt=""
            fill
            priority
            sizes="100vw"
            unoptimized={lowRes}
            className={lowRes ? "-z-20 scale-125 object-cover opacity-50 blur-2xl" : "-z-20 object-cover"}
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/55 to-background/10" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <div className="grid w-full gap-8 px-4 pb-12 pt-32 md:grid-cols-[260px_1fr] md:gap-12 md:px-10 md:pb-16">
          <div className="hidden md:block">
            <Poster path={movie.posterPath} title={movie.title} sizes="260px" priority className="shadow-2xl shadow-black/70 ring-1 ring-white/15" />
          </div>
          <div className="max-w-3xl self-end">
            {movie.genres.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {movie.genres.slice(0, 4).map((g) => (
                  <Badge key={g} variant="glass" className="capitalize">{g}</Badge>
                ))}
              </div>
            )}
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] drop-shadow-lg md:text-6xl">{movie.title}</h1>
            {movie.tagline && <p className="mt-3 text-lg italic text-white/70">{movie.tagline}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-white/85">
              {movie.rating > 0 && (
                <span className="flex items-center gap-1 text-rating">
                  <Star className="size-4 fill-current" /> {movie.rating.toFixed(1)}
                </span>
              )}
              <span>{releaseYear(movie.releaseDate)}</span>
              {runtime && <span>{runtime}</span>}
              <Badge variant="outline">{movie.kind === "tv" ? "Series" : "Movie"}</Badge>
              {movie.playback?.kind === "stream" && <Badge variant="default">Full film</Badge>}
            </div>

            {movie.overview && <p className="mt-5 line-clamp-4 max-w-2xl text-base leading-relaxed text-white/80">{movie.overview}</p>}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {movie.playback && (
                <Button asChild variant="light" size="lg">
                  <a href="#watch">
                    <Play className="fill-current" /> {movie.playback.kind === "youtube" ? "Watch trailer" : "Play"}
                  </a>
                </Button>
              )}
              <SaveButton variant="full" item={saveItem} />
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-12 px-4 pb-16 pt-4 md:px-10">
        {/* Player */}
        {movie.playback && (
          <section id="watch" className="scroll-mt-24">
            <h2 className="mb-4 font-display text-2xl font-bold">{movie.playback.label}</h2>
            <VideoPlayer playback={movie.playback} poster={backdrop} title={movie.title} meta={saveItem} />
          </section>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0">
            {[
              ["overview", "Overview"],
              ...(movie.cast.length ? [["cast", "Cast"]] : []),
              ...(movie.similar.length ? [["similar", "More like this"]] : []),
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-b-2 border-transparent px-4 py-3 text-base font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="pt-8">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
              <p className="text-base leading-[1.9] text-foreground/85">{movie.overview || "No synopsis available."}</p>
              <dl className="grid gap-4 rounded-xl border border-border bg-card/60 p-6 text-sm">
                {facts.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[110px_1fr] gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </TabsContent>

          {movie.cast.length > 0 && (
            <TabsContent value="cast" className="pt-8">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {movie.cast.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 rounded-xl border border-border bg-card/60 p-4">
                    <Avatar className="size-12">
                      <AvatarFallback>{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      {p.character && <p className="truncate text-sm text-muted-foreground">{p.character}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
          )}

          {movie.similar.length > 0 && (
            <TabsContent value="similar" className="pt-8">
              <MovieGrid movies={movie.similar.slice(0, 12)} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
