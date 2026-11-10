import { fetchJson } from "./http";
import type {
  Country, Genre, ItemKind, Language, Movie, MovieCategory, MovieFilters, MovieProvider, Paginated, Playback,
  SectionId,
} from "../types";

const BASE_URL = process.env.MOVIE_API_BASE_URL ?? "https://api.themoviedb.org/3";
const TOKEN = process.env.MOVIE_API_TOKEN;
/**
 * Optional: your own licensed full-film servers, comma-separated, tried in order, e.g.
 * https://cdn1.example.com/{id}/master.m3u8,https://cdn2.example.com/{id}.mp4
 */
const STREAM_TEMPLATES = (process.env.MOVIE_STREAM_URL_TEMPLATE ?? "")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

export const hasApiToken = Boolean(TOKEN);

/** Which TMDB catalogue backs each section. */
const KIND: Record<SectionId, ItemKind> = { movies: "movie", indian: "movie", serials: "tv", cartoons: "movie", drama: "tv" };
/** Sections that are a fixed genre of a catalogue (cartoons = Animation films, drama = Drama series). */
const BASE_GENRE: Partial<Record<SectionId, string>> = { cartoons: "16", drama: "18" };
/** Indian cinema = films originating in India (language is a filter on top). */
const BASE_COUNTRY: Partial<Record<SectionId, string>> = { indian: "IN" };
/** Genre slugs offered inside the constrained sections. */
const SECTION_GENRE_SLUGS: Partial<Record<SectionId, string[]>> = {
  cartoons: ["comedy", "family", "adventure", "fantasy", "science-fiction", "music", "action", "mystery", "romance"],
  drama: ["crime", "mystery", "family", "soap", "war-politics", "sci-fi-fantasy", "action-adventure", "comedy", "western"],
};

const listPath: Record<ItemKind, Partial<Record<MovieCategory, string>>> = {
  movie: {
    trending: "/trending/movie/week",
    latest: "/movie/now_playing",
    upcoming: "/movie/upcoming",
    "top-rated": "/movie/top_rated",
    popular: "/movie/popular",
  },
  tv: {
    trending: "/trending/tv/week",
    latest: "/tv/on_the_air",
    "top-rated": "/tv/top_rated",
    popular: "/tv/popular",
  },
};

type RawItem = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
};
type RawList = { page: number; total_pages: number; results: RawItem[] };

async function request<T>(path: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const { status, data } = await fetchJson<T>(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: "application/json" },
  });
  if (status === 404) return null;
  if (!data) throw new Error(`Movie API ${status} for ${path}`);
  return data;
}

function toItem(raw: RawItem, kind: ItemKind): Movie {
  return {
    id: String(raw.id),
    kind,
    title: raw.title ?? raw.name ?? "Untitled",
    overview: raw.overview ?? "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date || raw.first_air_date || null,
    rating: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
  };
}

function toPage(raw: RawList | null, page: number, kind: ItemKind | "multi"): Paginated<Movie> {
  if (!raw) return { results: [], page, totalPages: 0 };
  const results = raw.results
    .filter((r) => kind !== "multi" || r.media_type === "movie" || r.media_type === "tv")
    .map((r) => toItem(r, kind === "multi" ? (r.media_type as ItemKind) : kind));
  return { results, page: raw.page, totalPages: Math.min(raw.total_pages, 500) };
}

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const sortParam = {
  movie: {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    newest: "primary_release_date.desc",
    oldest: "primary_release_date.asc",
  },
  tv: {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    newest: "first_air_date.desc",
    oldest: "first_air_date.asc",
  },
} as const;

const hasFilters = (f: MovieFilters, section: SectionId) =>
  Boolean(BASE_GENRE[section]) || Boolean(BASE_COUNTRY[section]) ||
  f.genres.length > 0 || f.yearFrom !== undefined || f.yearTo !== undefined || f.minRating !== undefined ||
  f.sort !== undefined || f.language !== undefined || f.country !== undefined;

/** Any active filter (or a constrained section) uses /discover; category semantics are kept as defaults. */
function discoverParams(section: SectionId, category: MovieCategory, f: MovieFilters): Record<string, string | number> {
  const kind = KIND[section];
  const dateKey = kind === "movie" ? "primary_release_date" : "first_air_date";
  const today = new Date().toISOString().slice(0, 10);
  const params: Record<string, string | number> = { include_adult: "false" };

  const base = BASE_GENRE[section];
  if (base) params.with_genres = [base, ...f.genres].join(","); // base AND picked
  else if (f.genres.length) params.with_genres = f.genres.join("|"); // any of picked

  if (f.language) params.with_original_language = f.language;
  const country = BASE_COUNTRY[section] ?? f.country;
  if (country) params.with_origin_country = country;

  let gte = f.yearFrom ? `${f.yearFrom}-01-01` : undefined;
  let lte = f.yearTo ? `${f.yearTo}-12-31` : undefined;
  if (category === "latest" && (!lte || lte > today)) lte = today;
  if (category === "upcoming" && (!gte || gte < today)) gte = today;
  if (gte) params[`${dateKey}.gte`] = gte;
  if (lte) params[`${dateKey}.lte`] = lte;

  const defaultSort =
    category === "latest" ? "newest" : category === "upcoming" ? "oldest" : category === "top-rated" ? "rating" : "popularity";
  const sort = f.sort ?? defaultSort;
  params.sort_by = sortParam[kind][sort];

  if (f.minRating !== undefined) params["vote_average.gte"] = f.minRating;
  if (sort === "rating" || category === "top-rated" || f.minRating !== undefined) params["vote_count.gte"] = 200;
  else if (category === "latest") params["vote_count.gte"] = kind === "movie" ? 10 : 3;
  return params;
}

type RawDetail = RawItem & {
  tagline?: string;
  runtime?: number | null;
  episode_run_time?: number[];
  number_of_seasons?: number;
  in_production?: boolean;
  status?: string;
  genres?: { name: string }[];
  created_by?: { name: string }[];
  credits?: {
    cast?: { id: number; name: string; character: string }[];
    crew?: { name: string; job: string }[];
  };
  videos?: { results?: { key: string; site: string; type: string; official?: boolean }[] };
  similar?: RawList;
};

function resolvePlayback(kind: ItemKind, id: string, raw: RawDetail): Playback | null {
  const yt = raw.videos?.results?.filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) ?? [];
  const trailer = yt.find((v) => v.type === "Trailer" && v.official) ?? yt.find((v) => v.type === "Trailer") ?? yt[0];

  if (STREAM_TEMPLATES.length && kind === "movie") {
    return {
      kind: "stream",
      label: "Full film",
      trailerKey: trailer?.key ?? null,
      sources: STREAM_TEMPLATES.map((t, i) => {
        const url = t.replaceAll("{id}", id);
        return { url, type: url.includes(".m3u8") ? "hls" : "file", label: `Server ${i + 1}` } as const;
      }),
    };
  }
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
  { code: "ml", name: "Malayalam" }, { code: "kn", name: "Kannada" }, { code: "pa", name: "Punjabi" },
  { code: "mr", name: "Marathi" }, { code: "ur", name: "Urdu" }, { code: "gu", name: "Gujarati" }, { code: "th", name: "Thai" },
];

export const tmdbProvider: MovieProvider = {
  id: "tmdb",
  attribution: "Film and TV data provided by TMDB.",

  categories(section) {
    return KIND[section] === "movie" ? ["latest", "upcoming", "top-rated", "popular"] : ["latest", "top-rated", "popular"];
  },

  async genres(section): Promise<Genre[]> {
    const raw = await request<{ genres: { id: number; name: string }[] }>(`/genre/${KIND[section]}/list`);
    const all = (raw?.genres ?? []).map((g) => ({ id: String(g.id), name: g.name, slug: slugify(g.name) }));
    const allowed = SECTION_GENRE_SLUGS[section];
    return allowed ? all.filter((g) => allowed.includes(g.slug)) : all;
  },

  languages: () => LANGUAGES,
  countries: () => COUNTRIES,

  bounds() {
    return { yearMin: 1900, yearMax: new Date().getFullYear() + 1 };
  },

  async list(section, category, page, filters) {
    const kind = KIND[section];
    const raw = hasFilters(filters, section)
      ? await request<RawList>(`/discover/${kind}`, { page, ...discoverParams(section, category, filters) })
      : await request<RawList>(listPath[kind][category] ?? listPath[kind].popular!, { page });
    return toPage(raw, page, kind);
  },

  async search(query, page) {
    return toPage(await request<RawList>("/search/multi", { query, page, include_adult: "false" }), page, "multi");
  },

  async detail(kind, id) {
    if (!/^\d+$/.test(id)) return null;
    const raw = await request<RawDetail>(`/${kind}/${id}`, { append_to_response: "credits,videos,similar" });
    if (!raw) return null;

    const runtime = kind === "movie" ? raw.runtime ?? null : raw.episode_run_time?.[0] ?? null;
    const status =
      kind === "tv"
        ? [raw.number_of_seasons ? `${raw.number_of_seasons} season${raw.number_of_seasons > 1 ? "s" : ""}` : "", raw.status ?? ""]
            .filter(Boolean)
            .join(" · ")
        : raw.status ?? "";

    return {
      ...toItem(raw, kind),
      tagline: raw.tagline ?? "",
      runtime,
      status,
      genres: (raw.genres ?? []).map((g) => g.name),
      directors:
        kind === "tv"
          ? (raw.created_by ?? []).map((c) => c.name)
          : (raw.credits?.crew ?? []).filter((c) => c.job === "Director").map((c) => c.name),
      cast: (raw.credits?.cast ?? []).slice(0, 12).map((c) => ({ id: String(c.id), name: c.name, character: c.character })),
      playback: resolvePlayback(kind, id, raw),
      similar: (raw.similar?.results ?? []).slice(0, 12).map((r) => toItem(r, kind)),
    };
  },
};
