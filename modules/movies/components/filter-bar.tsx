"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { categoryMeta } from "../categories";
import { activeFilterCount, decades, hrefWith, ratingOptions, sortOptions } from "../filters";
import { sectionHref, type SectionDef } from "../sections";
import type { Country, FilterBounds, Genre, Language, MovieCategory, MovieFilters, SortKey } from "../types";

const ANY = "any";
const GENRE_PREVIEW = 14;

export function FilterBar({
  section,
  category,
  categories,
  genres,
  languages,
  countries,
  bounds,
  filters,
}: {
  section: SectionDef;
  category: MovieCategory;
  categories: readonly MovieCategory[];
  genres: Genre[];
  languages: Language[];
  countries: Country[];
  bounds: FilterBounds;
  filters: MovieFilters;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showAllGenres, setShowAllGenres] = useState(false);

  const has = (c: SectionDef["controls"][number]) => section.controls.includes(c);
  const basePath = sectionHref(section.id, category);

  const go = (next: Partial<MovieFilters>) =>
    startTransition(() => router.push(hrefWith(basePath, { ...filters, ...next }), { scroll: false }));

  const years: number[] = [];
  for (let y = bounds.yearMax; y >= bounds.yearMin; y--) years.push(y);
  const chipYears = years.filter((y) => y >= section.yearChipsFrom);
  const activeYear = chipYears.find((y) => filters.yearFrom === y && (filters.yearTo ?? bounds.yearMax) === y);
  const decadeList = decades(bounds, section.decadeFrom);
  const activeDecade = decadeList.find((d) => filters.yearFrom === d.from && (filters.yearTo ?? bounds.yearMax) === d.to);

  const toggleGenre = (id: string) =>
    go({ genres: filters.genres.includes(id) ? filters.genres.filter((g) => g !== id) : [...filters.genres, id] });

  const visibleGenres = showAllGenres
    ? genres
    : genres.filter((g, i) => i < GENRE_PREVIEW || filters.genres.includes(g.id));

  const count = activeFilterCount(filters);
  const label = "mb-2 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground";
  const chip = (on: boolean) =>
    cn(
      "border px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors",
      on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary",
    );

  return (
    <section aria-label={`${section.title} filters`} className="mb-12 border-y border-border py-6">
      {/* Collection tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Collections" className="flex flex-wrap gap-x-8 gap-y-2">
          {categories
            .filter((c) => c !== "trending")
            .map((c) => (
              <Link
                key={c}
                href={hrefWith(sectionHref(section.id, c), filters)}
                aria-current={c === category ? "page" : undefined}
                className={cn(
                  "border-b pb-2 font-serif text-xl transition-colors md:text-2xl",
                  c === category ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-primary",
                )}
              >
                {categoryMeta[c].nav}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {pending && <Loader2 className="size-4 animate-spin text-primary" aria-label="Updating" />}
          {count > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href={basePath} scroll={false}><RotateCcw /> Reset ({count})</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Selects */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {has("sort") && (
          <div>
            <span className={label}>Sort by</span>
            <Select value={filters.sort ?? "default"} onValueChange={(v) => go({ sort: v === "default" ? undefined : (v as SortKey) })}>
              <SelectTrigger aria-label="Sort by"><SelectValue /></SelectTrigger>
              <SelectContent>
                {sortOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {has("year") && (
          <>
            <div>
              <span className={label}>Year from</span>
              <Select value={String(filters.yearFrom ?? ANY)} onValueChange={(v) => go({ yearFrom: v === ANY ? undefined : Number(v) })}>
                <SelectTrigger aria-label="Year from"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={ANY}>Any</SelectItem>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className={label}>Year to</span>
              <Select value={String(filters.yearTo ?? ANY)} onValueChange={(v) => go({ yearTo: v === ANY ? undefined : Number(v) })}>
                <SelectTrigger aria-label="Year to"><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={ANY}>Any</SelectItem>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {has("rating") && (
          <div>
            <span className={label}>Rating</span>
            <Select
              value={filters.minRating ? String(Math.floor(filters.minRating)) : ANY}
              onValueChange={(v) => go({ minRating: v === ANY ? undefined : Number(v) })}
            >
              <SelectTrigger aria-label="Minimum rating"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ratingOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {has("country") && countries.length > 0 && (
          <div>
            <span className={label}>Country</span>
            <Select value={filters.country ?? ANY} onValueChange={(v) => go({ country: v === ANY ? undefined : v })}>
              <SelectTrigger aria-label="Country"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={ANY}>All countries</SelectItem>
                {countries.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {has("language") && languages.length > 0 && (
          <div>
            <span className={label}>Language</span>
            <Select value={filters.language ?? ANY} onValueChange={(v) => go({ language: v === ANY ? undefined : v })}>
              <SelectTrigger aria-label="Original language"><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value={ANY}>Any language</SelectItem>
                {languages.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Decades */}
      {has("decade") && decadeList.length > 0 && (
        <div className="mt-6">
          <span className={label}>Decade</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(!activeDecade)} aria-pressed={!activeDecade} onClick={() => go({ yearFrom: undefined, yearTo: undefined })}>
              All time
            </button>
            {decadeList.map((d) => (
              <button
                key={d.label}
                type="button"
                className={chip(activeDecade?.label === d.label)}
                aria-pressed={activeDecade?.label === d.label}
                onClick={() => go({ yearFrom: d.from, yearTo: d.to })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Every year */}
      {has("yearChips") && chipYears.length > 0 && (
        <div className="mt-6">
          <span className={label}>Year {activeYear && <span className="text-primary">· {activeYear}</span>}</span>
          <div className="flex flex-wrap gap-2">
            {chipYears.map((y) => (
              <button
                key={y}
                type="button"
                className={cn(chip(activeYear === y), "tabular-nums tracking-[0.1em]")}
                aria-pressed={activeYear === y}
                onClick={() => (activeYear === y ? go({ yearFrom: undefined, yearTo: undefined }) : go({ yearFrom: y, yearTo: y }))}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Genres / themes (multi-select) */}
      {has("genre") && genres.length > 0 && (
        <div className="mt-6">
          <span className={label}>
            {section.genreLabel}{" "}
            {filters.genres.length > 0 && <span className="text-primary">· {filters.genres.length} selected</span>}
          </span>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={chip(filters.genres.length === 0)} aria-pressed={filters.genres.length === 0} onClick={() => go({ genres: [] })}>
              All
            </button>
            {visibleGenres.map((g) => (
              <button
                key={g.id}
                type="button"
                className={chip(filters.genres.includes(g.id))}
                aria-pressed={filters.genres.includes(g.id)}
                onClick={() => toggleGenre(g.id)}
              >
                {g.name}
              </button>
            ))}
            {genres.length > GENRE_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllGenres((v) => !v)}
                className="px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-primary transition-colors hover:text-foreground"
              >
                {showAllGenres ? "Show fewer" : `+ ${genres.length - visibleGenres.length} more`}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
