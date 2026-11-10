import { cacheLife, cacheTag } from "next/cache";
import { hasApiToken, tmdbProvider } from "../api/tmdb";
import { mockProvider } from "../api/mock";
import type { MovieCategory } from "../types";

const provider = hasApiToken ? tmdbProvider : mockProvider;

export const isDemoMode = !hasApiToken;

export async function getMovies(category: MovieCategory, page = 1) {
  "use cache";
  cacheLife("hours");
  cacheTag("movies", `movies:${category}`);
  return provider.list(category, page);
}

export async function searchMovies(query: string, page = 1) {
  "use cache";
  cacheLife("minutes");
  return provider.search(query, page);
}

export async function getMovie(id: number) {
  "use cache";
  cacheLife("hours");
  cacheTag("movies", `movie:${id}`);
  return provider.detail(id);
}
