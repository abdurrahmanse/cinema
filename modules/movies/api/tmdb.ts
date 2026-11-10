import type { CastMember, Movie, MovieCategory, MovieDetail, MovieProvider, Paginated } from "../types";

const BASE_URL = process.env.MOVIE_API_BASE_URL ?? "https://api.themoviedb.org/3";
const TOKEN = process.env.MOVIE_API_TOKEN;

export const hasApiToken = Boolean(TOKEN);

const listPath: Record<MovieCategory, string> = {
  trending: "/trending/movie/week",
  "now-playing": "/movie/now_playing",
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

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Movie API ${res.status} for ${path}`);
  return (await res.json()) as T;
}

function toMovie(raw: RawMovie): Movie {
  return {
    id: raw.id,
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
  return {
    results: raw.results.map(toMovie),
    page: raw.page,
    totalPages: Math.min(raw.total_pages, 500),
  };
}

type RawDetail = RawMovie & {
  tagline?: string;
  runtime?: number | null;
  status?: string;
  genres?: { name: string }[];
  credits?: {
    cast?: { id: number; name: string; character: string; profile_path: string | null }[];
    crew?: { name: string; job: string }[];
  };
  videos?: { results?: { key: string; site: string; type: string; official?: boolean }[] };
  similar?: RawList;
};

export const tmdbProvider: MovieProvider = {
  async list(category, page) {
    return toPage(await request<RawList>(listPath[category], { page }), page);
  },

  async search(query, page) {
    return toPage(await request<RawList>("/search/movie", { query, page, include_adult: "false" }), page);
  },

  async detail(id) {
    const raw = await request<RawDetail>(`/movie/${id}`, {
      append_to_response: "credits,videos,similar",
    });
    if (!raw) return null;

    const trailer =
      raw.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer" && v.official) ??
      raw.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");

    const cast: CastMember[] = (raw.credits?.cast ?? []).slice(0, 12).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profilePath: c.profile_path,
    }));

    return {
      ...toMovie(raw),
      tagline: raw.tagline ?? "",
      runtime: raw.runtime ?? null,
      status: raw.status ?? "",
      genres: (raw.genres ?? []).map((g) => g.name),
      directors: (raw.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name),
      cast,
      trailerKey: trailer?.key ?? null,
      similar: (raw.similar?.results ?? []).slice(0, 12).map(toMovie),
    } satisfies MovieDetail;
  },
};
