import type { Country, FilterBounds, Genre, Language, MovieFilters, SortKey } from "./types";

export const sortOptions: { value: SortKey | "default"; label: string }[] = [
  { value: "default", label: "Recommended" },
  { value: "popularity", label: "Most popular" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => (v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);

/** Validates untrusted URL params against the provider's genres and bounds. */
export function parseFilters(
  sp: Record<string, string | string[] | undefined>,
  genres: Genre[],
  bounds: FilterBounds,
  languages: Language[] = [],
  countries: Country[] = [],
): MovieFilters {
  const valid = new Set(genres.map((g) => g.id));
  const picked = (one(sp.genre) ?? "").split(",").filter((id) => valid.has(id));

  const clampYear = (n: number | undefined) =>
    n === undefined ? undefined : Math.min(bounds.yearMax, Math.max(bounds.yearMin, Math.round(n)));
  let yearFrom = clampYear(num(one(sp.from)));
  let yearTo = clampYear(num(one(sp.to)));
  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) [yearFrom, yearTo] = [yearTo, yearFrom];
  if (yearFrom === bounds.yearMin) yearFrom = undefined;
  if (yearTo === bounds.yearMax) yearTo = undefined;

  const rating = num(one(sp.rating));
  const minRating = rating && rating > 0 ? Math.min(9, Math.max(1, rating)) : undefined;

  const sortRaw = one(sp.sort);
  const sort = sortOptions.some((o) => o.value === sortRaw && o.value !== "default") ? (sortRaw as SortKey) : undefined;

  const langRaw = one(sp.lang);
  const language = langRaw && languages.some((l) => l.code === langRaw) ? langRaw : undefined;

  const countryRaw = one(sp.country);
  const country = countryRaw && countries.some((c) => c.code === countryRaw) ? countryRaw : undefined;

  return { genres: [...new Set(picked)], yearFrom, yearTo, minRating, sort, language, country };
}

export function filtersToParams(f: MovieFilters): URLSearchParams {
  const q = new URLSearchParams();
  if (f.genres.length) q.set("genre", f.genres.join(","));
  if (f.yearFrom !== undefined) q.set("from", String(f.yearFrom));
  if (f.yearTo !== undefined) q.set("to", String(f.yearTo));
  if (f.minRating !== undefined) q.set("rating", String(f.minRating));
  if (f.sort) q.set("sort", f.sort);
  if (f.language) q.set("lang", f.language);
  if (f.country) q.set("country", f.country);
  return q;
}

export function hrefWith(basePath: string, f: MovieFilters, page?: number): string {
  const q = filtersToParams(f);
  if (page && page > 1) q.set("page", String(page));
  const qs = q.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function activeFilterCount(f: MovieFilters): number {
  return f.genres.length + Number(f.yearFrom !== undefined || f.yearTo !== undefined) + Number(f.minRating !== undefined) + Number(f.sort !== undefined) + Number(f.language !== undefined) + Number(f.country !== undefined);
}

export const ratingOptions = [
  { value: "any", label: "Any rating" },
  ...[5, 6, 7, 8].map((n) => ({ value: String(n), label: `★ ${n}+` })),
];

const DECADES_FROM = 2000;

/** Quick-pick decade chips: 2000s up to the current decade. */
export function decades(bounds: FilterBounds): { label: string; from: number; to: number }[] {
  const out = [];
  for (let d = Math.floor(bounds.yearMax / 10) * 10; d >= DECADES_FROM; d -= 10) {
    out.push({ label: `${d}s`, from: Math.max(d, bounds.yearMin), to: Math.min(d + 9, bounds.yearMax) });
  }
  return out;
}
