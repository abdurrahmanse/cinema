import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Container } from "@/shared/ui/container";
import { releaseYear } from "@/shared/lib/format";
import { imageUrl, isOptimizable } from "../image";
import type { Movie } from "../types";

export function Hero({ movie }: { movie: Movie }) {
  const backdrop = imageUrl(movie.backdropPath, "w1280");
  const lowRes = backdrop ? !isOptimizable(backdrop) : false;
  return (
    <section className="relative isolate flex min-h-[78vh] items-end overflow-hidden border-b border-border">
      {backdrop && (
        <Image
          src={backdrop}
          alt=""
          fill
          priority
          sizes="100vw"
          unoptimized={lowRes}
          className={`-z-20 object-cover opacity-60 ${lowRes ? "scale-110 blur-xl" : ""}`}
        />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-background/70 to-background/10" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background/80 to-transparent" />
      <Container className="pb-16 pt-40 md:pb-24">
        <p className="mb-5 text-[11px] uppercase tracking-[0.32em] text-primary">Featured</p>
        <h1 className="max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">{movie.title}</h1>
        <p className="mt-5 text-xs tracking-[0.2em] text-muted-foreground">
          {releaseYear(movie.releaseDate)}
          {movie.rating > 0 && <span className="text-primary"> · ★ {movie.rating.toFixed(1)}</span>}
        </p>
        {movie.overview && (
          <p className="mt-6 line-clamp-3 max-w-xl text-base leading-relaxed text-foreground/80">{movie.overview}</p>
        )}
        <Button asChild variant="outline" className="mt-10">
          <Link href={`/movie/${encodeURIComponent(movie.id)}#watch`}>
            <Play /> Watch now
          </Link>
        </Button>
      </Container>
    </section>
  );
}
