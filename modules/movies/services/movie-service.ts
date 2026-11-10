import { cacheLife, cacheTag } from "next/cache";
import { archiveProvider } from "../api/archive";
import { hasApiToken, tmdbProvider } from "../api/tmdb";
import type { ItemKind, MovieCategory, MovieFilters, SectionId } from "../types";

// TMDB when a token is configured (latest releases, trailers), otherwise the keyless Internet Archive.
const provider = hasApiToken ? tmdbProvider : archiveProvider;

export const providerInfo = { id: provider.id, attribution: provider.attribution } as const;

export const categoriesFor = (section: SectionId) => provider.categories(section);
export const filterBounds = provider.bounds();
export const filterLanguages = provider.languages();
export const filterCountries = provider.countries();

export async function getGenres(section: SectionId) {
  "use cache";
  cacheLife("days");
  return provider.genres(section);
}

export async function getMovies(
  section: SectionId,
  category: MovieCategory,
  page = 1,
  filters: MovieFilters = { genres: [] },
) {
  "use cache";
  // New releases are refreshed within minutes; evergreen lists hourly.
  if (category === "latest" || category === "trending" || category === "upcoming") cacheLife("minutes");
  else cacheLife("hours");
  cacheTag("movies", `movies:${section}`, `movies:${section}:${category}`);
  return provider.list(section, category, page, filters);
}

export async function searchMovies(query: string, page = 1) {
  "use cache";
  cacheLife("minutes");
  return provider.search(query, page);
}

export async function getMovie(kind: ItemKind, id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("movies", `${kind}:${id}`);
  return provider.detail(kind, id);
}
