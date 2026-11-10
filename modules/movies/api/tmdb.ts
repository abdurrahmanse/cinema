import type {
  Genre, Movie, MovieCategory, MovieProvider, Paginated, Playback,
} from "../types";

const BASE_URL = process.env.MOVIE_API_BASE_URL ?? "https://api.themoviedb.org/3";
const TOKEN = process.env.MOVIE_API_TOKEN;
/** Optional: your own licensed full-film source, e.g. https://cdn.example.com/{id}/master.m3u8 */
const STREAM_TEMPLATE = process.env.MOVIE_STREAM_URL_TEMPLATE;

export const hasApiToken = Boolean(TOKEN);

const listPath: Record<MovieCategory, string> = {
  trending: "/trending/movie/week",
  latest: "/movie/now_playing",
  upcoming: "/movie/upcoming",
  "top-rated": "/movie/top_rated",
  popular: "/movie/popular",
};

type RawMovie = {
  id: number;
  title: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average?: number;
  vote_count?: number;
};
type RawList = { page: number; total_pages: number; results: RawMovie[] };

async function request<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Movie API ${res.status} for ${path}`);
  return (await res.json()) as T;
}

function toMovie(raw: RawMovie): Movie {
  return {
    id: String(raw.id),
    title: raw.title,
    overview: raw.overview ?? "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date || null,
    rating: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
  };
}

function toPage(raw: RawList | null, page: number): Paginated<Movie> {
  if (!raw) return { results: [], page, totalPages: 0 };
  return { results: raw.results.map(toMovie), page: raw.page, totalPages: Math.min(raw.total_pages, 500) };
}

/** Genre-filtered lists use /discover with a sort that mirrors each category. */
function discoverParams(category: MovieCategory, genre: string): Record<string, string | number> {
  const today = new Date().toISOString().slice(0, 10);
  const base = { with_genres: genre, include_adult: "false" };
  switch (category) {
    case "latest":
      return { ...base, sort_by: "primary_release_date.desc", "primary_release_date.lte": today, "vote_count.gte": 10 };
    case "upcoming":
      return { ...base, sort_by: "primary_release_date.asc", "primary_release_date.gte": today };
    case "top-rated":
      return { ...base, sort_by: "vote_average.desc", "vote_count.gte": 300 };
    default:
      return { ...base, sort_by: "popularity.desc" };
  }
}

type RawDetail = RawMovie & {
  tagline?: string;
  runtime?: number | null;
  status?: string;
  genres?: { name: string }[];
  credits?: {
    cast?: { id: number; name: string; character: string }[];
    crew?: { name: string; job: string }[];
  };
  videos?: { results?: { key: string; site: string; type: string; official?: boolean }[] };
  similar?: RawList;
};

function resolvePlayback(id: string, raw: RawDetail): Playback | null {
  if (STREAM_TEMPLATE) {
    const url = STREAM_TEMPLATE.replaceAll("{id}", id);
    return url.includes(".m3u8")
      ? { kind: "hls", url, label: "Full film" }
      : { kind: "file", url, label: "Full film" };
  }
  const yt = raw.videos?.results?.filter((v) => v.site === "YouTube" && v.type === "Trailer") ?? [];
  const trailer = yt.find((v) => v.official) ?? yt[0];
  return trailer ? { kind: "youtube", key: trailer.key, label: "Official trailer" } : null;
}

export const tmdbProvider: MovieProvider = {
  id: "tmdb",
  attribution: "Film data provided by TMDB.",
  categories: ["trending", "latest", "upcoming", "top-rated", "popular"],

  async genres(): Promise<Genre[]> {
    const raw = await request<{ genres: { id: number; name: string }[] }>("/genre/movie/list");
    return (raw?.genres ?? []).map((g) => ({ id: String(g.id), name: g.name }));
  },

  async list(category, page, genre) {
    const raw = genre
      ? await request<RawList>("/discover/movie", { page, ...discoverParams(category, genre) })
      : await request<RawList>(listPath[category], { page });
    return toPage(raw, page);
  },

  async search(query, page) {
    return toPage(await request<RawList>("/search/movie", { query, page, include_adult: "false" }), page);
  },

  async detail(id) {
    if (!/^\d+$/.test(id)) return null;
    const raw = await request<RawDetail>(`/movie/${id}`, { append_to_response: "credits,videos,similar" });
    if (!raw) return null;
    return {
      ...toMovie(raw),
      tagline: raw.tagline ?? "",
      runtime: raw.runtime ?? null,
      status: raw.status ?? "",
      genres: (raw.genres ?? []).map((g) => g.name),
      directors: (raw.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name),
      cast: (raw.credits?.cast ?? []).slice(0, 12).map((c) => ({
        id: String(c.id),
        name: c.name,
        character: c.character,
      })),
      playback: resolvePlayback(id, raw),
      similar: (raw.similar?.results ?? []).slice(0, 12).map(toMovie),
    };
  },
};
