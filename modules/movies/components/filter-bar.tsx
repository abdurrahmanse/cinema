"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { cn } from "@/shared/lib/utils";
import { categoryMeta } from "../categories";
import { activeFilterCount, decades, hrefWith, ratingOptions, sortOptions } from "../filters";
import { sectionHref, type SectionDef } from "../sections";
import type { Country, FilterBounds, Genre, Language, MovieCategory, MovieFilters, SortKey } from "../types";

const ANY = "any";

const pill = (on: boolean) =>
  cn(
    "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
    on ? "border-white bg-white text-black" : "border-white/15 bg-white/[0.04] text-white/75 hover:border-white/40 hover:text-white",
  );

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
  const [moreOpen, setMoreOpen] = useState(false);

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

  const count = activeFilterCount(filters);
  const label = "mb-1.5 block text-xs font-medium text-muted-foreground";
  const showLangSelect = has("language") && languages.length > 0 && !section.languagePills;
  const hasMore = (has("decade") && decadeList.length > 0) || (has("yearChips") && chipYears.length > 0);

  return (
    <section aria-label={`${section.title} filters`} className="mb-10 space-y-5">
      {/* Collection tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Collections" className="scrollbar-none flex gap-2 overflow-x-auto">
          {categories
            .filter((c) => c !== "trending")
            .map((c) => (
              <Link
                key={c}
                href={hrefWith(sectionHref(section.id, c), filters)}
                aria-current={c === category ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                  c === category ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/[0.06] text-white/75 hover:bg-white/10 hover:text-white",
                )}
              >
                {categoryMeta[c].nav}
              </Link>
            ))}
        </nav>
        <div className="flex items-center gap-2">
          {pending && <Loader2 className="size-4 animate-spin text-primary" aria-label="Updating" />}
          {count > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href={basePath} scroll={false}><RotateCcw /> Reset ({count})</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Language pills (Indian cinema) */}
      {section.languagePills && languages.length > 0 && (
        <div>
          <span className={label}>Language</span>
          <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
            <button type="button" className={pill(!filters.language)} aria-pressed={!filters.language} onClick={() => go({ language: undefined })}>
              All languages
            </button>
            {languages.map((l) => (
              <button key={l.code} type="button" className={pill(filters.language === l.code)} aria-pressed={filters.language === l.code} onClick={() => go({ language: l.code })}>
                {l.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selects */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {has("sort") && (
          <div>
            <span className={label}>Sort by</span>
            <Select value={filters.sort ?? "default"} onValueChange={(v) => go({ sort: v === "default" ? undefined : (v as SortKey) })}>
              <SelectTrigger aria-label="Sort by"><SelectValue /></SelectTrigger>
              <SelectContent>{sortOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
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
            <Select value={filters.minRating ? String(Math.floor(filters.minRating)) : ANY} onValueChange={(v) => go({ minRating: v === ANY ? undefined : Number(v) })}>
              <SelectTrigger aria-label="Minimum rating"><SelectValue /></SelectTrigger>
              <SelectContent>{ratingOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
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
        {showLangSelect && (
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

      {/* Genres */}
      {has("genre") && genres.length > 0 && (
        <div>
          <span className={label}>
            {section.genreLabel}
            {filters.genres.length > 0 && <span className="text-primary"> · {filters.genres.length} selected</span>}
          </span>
          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            <button type="button" className={pill(filters.genres.length === 0)} aria-pressed={filters.genres.length === 0} onClick={() => go({ genres: [] })}>
              All
            </button>
            {genres.map((g) => (
              <button key={g.id} type="button" className={pill(filters.genres.includes(g.id))} aria-pressed={filters.genres.includes(g.id)} onClick={() => toggleGenre(g.id)}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* More: decades and every year */}
      {hasMore && (
        <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <SlidersHorizontal className="size-4" /> {moreOpen ? "Fewer filters" : "More filters"}
            <ChevronDown className={cn("size-4 transition-transform", moreOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-5 pt-5">
            {has("decade") && decadeList.length > 0 && (
              <div>
                <span className={label}>Decade</span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={pill(!activeDecade)} aria-pressed={!activeDecade} onClick={() => go({ yearFrom: undefined, yearTo: undefined })}>
                    All time
                  </button>
                  {decadeList.map((d) => (
                    <button key={d.label} type="button" className={pill(activeDecade?.label === d.label)} aria-pressed={activeDecade?.label === d.label} onClick={() => go({ yearFrom: d.from, yearTo: d.to })}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {has("yearChips") && chipYears.length > 0 && (
              <div>
                <span className={label}>Year {activeYear && <span className="text-primary">· {activeYear}</span>}</span>
                <div className="flex flex-wrap gap-2">
                  {chipYears.map((y) => (
                    <button
                      key={y}
                      type="button"
                      className={cn(pill(activeYear === y), "tabular-nums")}
                      aria-pressed={activeYear === y}
                      onClick={() => (activeYear === y ? go({ yearFrom: undefined, yearTo: undefined }) : go({ yearFrom: y, yearTo: y }))}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </section>
  );
}
