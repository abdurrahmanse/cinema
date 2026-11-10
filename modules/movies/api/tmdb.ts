import type {
  Country, Genre, Movie, MovieCategory, Language, MovieFilters, MovieProvider, Paginated, Playback,
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

const sortParam = {
  popularity: "popularity.desc",
  rating: "vote_average.desc",
  newest: "primary_release_date.desc",
  oldest: "primary_release_date.asc",
} as const;

export const hasFilters = (f: MovieFilters) =>
  f.genres.length > 0 || f.yearFrom !== undefined || f.yearTo !== undefined || f.minRating !== undefined || f.sort !== undefined || f.language !== undefined || f.country !== undefined;

/** Any active filter switches to /discover; category semantics are preserved as defaults/constraints. */
function discoverParams(category: MovieCategory, f: MovieFilters): Record<string, string | number> {
  const today = new Date().toISOString().slice(0, 10);
  const params: Record<string, string | number> = { include_adult: "false" };

  if (f.genres.length) params.with_genres = f.genres.join("|"); // OR
  if (f.language) params.with_original_language = f.language;
  if (f.country) params.with_origin_country = f.country;

  // date window = user range ∩ category constraint
  let gte = f.yearFrom ? `${f.yearFrom}-01-01` : undefined;
  let lte = f.yearTo ? `${f.yearTo}-12-31` : undefined;
  if (category === "latest" && (!lte || lte > today)) lte = today;
  if (category === "upcoming" && (!gte || gte < today)) gte = today;
  if (gte) params["primary_release_date.gte"] = gte;
  if (lte) params["primary_release_date.lte"] = lte;

  const defaultSort =
    category === "latest" ? "newest" : category === "upcoming" ? "oldest" : category === "top-rated" ? "rating" : "popularity";
  const sort = f.sort ?? defaultSort;
  params.sort_by = sortParam[sort];

  if (f.minRating !== undefined) params["vote_average.gte"] = f.minRating;
  if (sort === "rating" || category === "top-rated" || f.minRating !== undefined) params["vote_count.gte"] = 200;
  else if (category === "latest") params["vote_count.gte"] = 10;
  return params;
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

const COUNTRIES: Country[] = [
  { code: "US", name: "United States" }, { code: "GB", name: "United Kingdom" }, { code: "IN", name: "India" },
  { code: "BD", name: "Bangladesh" }, { code: "PK", name: "Pakistan" }, { code: "FR", name: "France" },
  { code: "DE", name: "Germany" }, { code: "IT", name: "Italy" }, { code: "ES", name: "Spain" },
  { code: "JP", name: "Japan" }, { code: "KR", name: "South Korea" }, { code: "CN", name: "China" },
  { code: "HK", name: "Hong Kong" }, { code: "TH", name: "Thailand" }, { code: "TR", name: "Türkiye" },
  { code: "RU", name: "Russia" }, { code: "BR", name: "Brazil" }, { code: "MX", name: "Mexico" },
  { code: "CA", name: "Canada" }, { code: "AU", name: "Australia" }, { code: "SE", name: "Sweden" },
  { code: "DK", name: "Denmark" }, { code: "NO", name: "Norway" }, { code: "PL", name: "Poland" },
  { code: "IR", name: "Iran" }, { code: "EG", name: "Egypt" }, { code: "SA", name: "Saudi Arabia" },
  { code: "NG", name: "Nigeria" }, { code: "ZA", name: "South Africa" }, { code: "ID", name: "Indonesia" },
  { code: "PH", name: "Philippines" }, { code: "AR", name: "Argentina" }, { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
];

const LANGUAGES: Language[] = [
  { code: "en", name: "English" }, { code: "bn", name: "Bengali" }, { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" }, { code: "te", name: "Telugu" }, { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" }, { code: "zh", name: "Chinese" }, { code: "fr", name: "French" },
  { code: "es", name: "Spanish" }, { code: "de", name: "German" }, { code: "it", name: "Italian" },
  { code: "tr", name: "Turkish" }, { code: "ar", name: "Arabic" }, { code: "ru", name: "Russian" },
];

export const tmdbProvider: MovieProvider = {
  id: "tmdb",
  attribution: "Film data provided by TMDB.",
  categories: ["trending", "latest", "upcoming", "top-rated", "popular"],

  async genres(): Promise<Genre[]> {
    const raw = await request<{ genres: { id: number; name: string }[] }>("/genre/movie/list");
    return (raw?.genres ?? []).map((g) => {
      const name = g.name === "Animation" ? "Cartoon & Animation" : g.name;
      return { id: String(g.id), name, slug: g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") };
    });
  },

  languages: () => LANGUAGES,
  countries: () => COUNTRIES,

  bounds() {
    return { yearMin: 1920, yearMax: new Date().getFullYear() + 1 };
  },

  async list(category, page, filters) {
    const raw = hasFilters(filters)
      ? await request<RawList>("/discover/movie", { page, ...discoverParams(category, filters) })
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
