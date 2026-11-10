import { cacheLife, cacheTag } from "next/cache";
import { archiveProvider } from "../api/archive";
import { hasApiToken, tmdbProvider } from "../api/tmdb";
import type { MovieCategory } from "../types";

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

export async function getMovies(category: MovieCategory, page = 1, genre?: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("movies", `movies:${category}`);
  return provider.list(category, page, genre);
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
