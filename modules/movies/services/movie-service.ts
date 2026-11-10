import { cacheLife, cacheTag } from "next/cache";
import { archiveProvider } from "../api/archive";
import { hasApiToken, tmdbProvider } from "../api/tmdb";
import type { MovieCategory, MovieFilters } from "../types";

// TMDB when a token is configured (latest releases, trailers), otherwise the keyless Internet Archive.
const provider = hasApiToken ? tmdbProvider : archiveProvider;

export const providerInfo = {
  id: provider.id,
  attribution: provider.attribution,
  categories: provider.categories,
} as const;

export async function getGenres() {
  "use cache";
  cacheLife("days");
  return provider.genres();
}

export const filterBounds = provider.bounds();
export const filterLanguages = provider.languages();
export const filterCountries = provider.countries();

export async function getMovies(category: MovieCategory, page = 1, filters: MovieFilters = { genres: [] }) {
  "use cache";
  // New releases are refreshed within minutes; evergreen lists hourly.
  if (category === "latest" || category === "trending" || category === "upcoming") cacheLife("minutes");
  else cacheLife("hours");
  cacheTag("movies", `movies:${category}`);
  return provider.list(category, page, filters);
}

export async function searchMovies(query: string, page = 1) {
  "use cache";
  cacheLife("minutes");
  return provider.search(query, page);
}

export async function getMovie(id: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("movies", `movie:${id}`);
  return provider.detail(id);
}

const FEATURED_SLUGS = ["drama", "animation", "action", "thriller"];

/** Genres highlighted in the header nav (those that exist in this source). */
export async function getFeaturedGenres() {
  const all = await getGenres();
  return FEATURED_SLUGS.map((slug) => all.find((g) => g.slug === slug)).filter((g): g is NonNullable<typeof g> => !!g).slice(0, 6);
}
