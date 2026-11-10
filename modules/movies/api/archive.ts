import type {
  Country, FilterBounds, Genre, ItemKind, Movie, MovieCategory, MovieFilters, MovieProvider, Paginated,
  SectionId, SortKey,
} from "../types";

// Internet Archive: keyless, public-domain films, serials and cartoons that stream directly.
const SEARCH_URL = "https://archive.org/advancedsearch.php";
const PAGE_SIZE = 20;
const YEAR_MIN = 1900;
const yearMax = () => new Date().getFullYear();

const BLOCKED = "NOT subject:(exploitation OR erotic OR nudist OR sexploitation OR porn OR xxx OR adult)";

/** Each section is a different slice of the Archive. */
const SCOPES: Record<SectionId, { query: string; minDownloads: number }> = {
  movies: { query: 'collection:feature_films AND NOT subject:(serial OR "tv series")', minDownloads: 2000 },
  serials: { query: '(collection:classic_tv OR subject:(serial OR "tv series" OR chapter))', minDownloads: 300 },
  cartoons: { query: "collection:(classic_cartoons OR animationandcartoons OR vintage_cartoons)", minDownloads: 300 },
  drama: {
    query: 'collection:classic_tv AND subject:(drama OR "tv drama" OR play OR theatre OR playhouse)',
    minDownloads: 100,
  },
};

const sortFor: Record<MovieCategory, string> = {
  trending: "downloads desc",
  popular: "downloads desc",
  "top-rated": "avg_rating desc",
  latest: "year desc",
  upcoming: "year desc",
};

const sortKeyMap: Record<SortKey, string> = {
  popularity: "downloads desc",
  rating: "avg_rating desc",
  newest: "year desc",
  oldest: "year asc",
};

type ArchiveGenre = Genre & { subjects: string[] };
const g = (id: string, name: string, ...subjects: string[]): ArchiveGenre => ({
  id, slug: id, name, subjects: subjects.length ? subjects : [id],
});

const MOVIE_GENRES: ArchiveGenre[] = [
  g("drama", "Drama"), g("comedy", "Comedy"), g("action", "Action"), g("adventure", "Adventure"),
  g("thriller", "Thriller"), g("crime", "Crime"), g("film-noir", "Film Noir", "film noir"), g("horror", "Horror"),
  g("sci-fi", "Science Fiction", "science fiction"), g("fantasy", "Fantasy"), g("western", "Western"),
  g("romance", "Romance"), g("mystery", "Mystery"), g("war", "War", "war", "world war"), g("musical", "Musical"),
  g("family", "Family"), g("documentary", "Documentary"), g("silent", "Silent Film"),
  g("biography", "Biography"), g("history", "History"), g("spy", "Spy"),
  g("martial-arts", "Martial Arts", "martial arts", "kung fu"), g("monster", "Monster"), g("zombie", "Zombie"),
  g("vampire", "Vampire"), g("detective", "Detective"), g("superhero", "Superhero"), g("b-movie", "B-Movie"),
  g("cult", "Cult Classic", "cult"), g("propaganda", "Propaganda"), g("jungle", "Jungle"), g("space", "Space"),
  g("ghost", "Supernatural", "ghost", "supernatural"),
];

const SERIAL_GENRES: ArchiveGenre[] = [
  g("western", "Western"), g("comedy", "Comedy"), g("drama", "Drama"), g("sci-fi", "Science Fiction", "science fiction"),
  g("detective", "Detective"), g("crime", "Crime"), g("adventure", "Adventure"), g("mystery", "Mystery"),
  g("action", "Action"), g("family", "Family"), g("music", "Music"), g("documentary", "Documentary"),
  g("variety", "Variety"), g("cooking", "Cooking & Lifestyle", "cooking", "lifestyle"),
];

const CARTOON_GENRES: ArchiveGenre[] = [
  g("comedy", "Comedy"), g("adventure", "Adventure"), g("fantasy", "Fantasy"), g("family", "Family"),
  g("musical", "Musical", "musical", "music"), g("sci-fi", "Science Fiction", "science fiction"),
  g("fairy-tale", "Fairy Tales", "fairy tale", "fairy tales"),
  g("stop-motion", "Stop Motion", "stop motion", "puppet"), g("christmas", "Christmas"), g("war", "WWII Propaganda", "war", "propaganda"),
];

const DRAMA_GENRES: ArchiveGenre[] = [
  g("crime", "Crime"), g("mystery", "Mystery"), g("romance", "Romance"),
  g("anthology", "Anthology"), g("comedy", "Comedy-Drama", "comedy"), g("war", "War"), g("sci-fi", "Science Fiction", "science fiction"),
  g("theatre", "Theatre & Stage", "theatre", "play", "playhouse"),
];

const GENRES_BY_SECTION: Record<SectionId, ArchiveGenre[]> = {
  movies: MOVIE_GENRES,
  serials: SERIAL_GENRES,
  cartoons: CARTOON_GENRES,
  drama: DRAMA_GENRES,
};

// Archive records rarely carry a country field, so we match nationality/language/subject tags (approximate).
const COUNTRIES: (Country & { terms: string[] })[] = [
  { code: "US", name: "United States", terms: ["american", "usa", "united states", "hollywood"] },
  { code: "GB", name: "United Kingdom", terms: ["british", "england", "united kingdom", "english film"] },
  { code: "FR", name: "France", terms: ["french", "france"] },
  { code: "DE", name: "Germany", terms: ["german", "germany"] },
  { code: "IT", name: "Italy", terms: ["italian", "italy"] },
  { code: "ES", name: "Spain", terms: ["spanish", "spain"] },
  { code: "RU", name: "Russia / USSR", terms: ["russian", "soviet", "russia", "ussr"] },
  { code: "JP", name: "Japan", terms: ["japanese", "japan"] },
  { code: "IN", name: "India", terms: ["hindi", "indian", "india", "bollywood"] },
  { code: "CN", name: "China", terms: ["chinese", "china", "hong kong"] },
];

function scopeQuery(section: SectionId): string {
  const { query, minDownloads } = SCOPES[section];
  return `${query} AND mediatype:movies AND format:(h.264 OR MPEG4) AND downloads:[${minDownloads} TO 99999999] AND ${BLOCKED}`;
}

function buildQuery(section: SectionId, f: MovieFilters): string {
  const parts = [scopeQuery(section), `year:[${f.yearFrom ?? YEAR_MIN} TO ${f.yearTo ?? yearMax()}]`];
  const subjects = f.genres.flatMap((id) => GENRES_BY_SECTION[section].find((x) => x.id === id)?.subjects ?? []);
  if (subjects.length) parts.push(`subject:(${subjects.map((s) => `"${s}"`).join(" OR ")})`);
  const terms = COUNTRIES.find((c) => c.code === f.country)?.terms;
  if (terms) {
    const q = terms.map((t) => `"${t}"`).join(" OR ");
    parts.push(`(subject:(${q}) OR country:(${q}) OR language:(${q}))`);
  }
  if (f.minRating) parts.push(`avg_rating:[${(f.minRating / 2).toFixed(1)} TO 5]`);
  return parts.join(" AND ");
}

type Doc = {
  identifier: string;
  title?: string | string[];
  description?: string | string[];
  year?: string | number;
  downloads?: number;
  avg_rating?: string | number;
  num_reviews?: number;
  subject?: string | string[];
  creator?: string | string[];
};

const first = <T,>(v: T | T[] | undefined): T | undefined => (Array.isArray(v) ? v[0] : v);
const list = (v: string | string[] | undefined): string[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** "The Phantom Planet (1961) | Public Domain…" -> "The Phantom Planet" */
function cleanTitle(raw: string): string {
  return raw.split("|")[0].replace(/\s*[([]\d{4}[)\]].*$/, "").replace(/\s+/g, " ").trim() || raw;
}

const thumb = (id: string) => `https://archive.org/services/img/${encodeURIComponent(id)}`;

function toMovie(doc: Doc): Movie {
  const year = Number(doc.year);
  const rating = Number(doc.avg_rating) * 2; // 5-star -> 10
  return {
    id: doc.identifier,
    kind: "movie",
    title: cleanTitle(String(first(doc.title) ?? doc.identifier)),
    overview: stripHtml(String(first(doc.description) ?? "")).slice(0, 600),
    posterPath: thumb(doc.identifier),
    backdropPath: thumb(doc.identifier),
    releaseDate: year ? String(year) : null,
    rating: Number.isFinite(rating) ? rating : 0,
    voteCount: doc.num_reviews ?? doc.downloads ?? 0,
  };
}

async function search(q: string, sort: string, page: number): Promise<Paginated<Movie>> {
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", q);
  for (const f of ["identifier", "title", "description", "year", "downloads", "avg_rating", "num_reviews", "subject"]) {
    url.searchParams.append("fl[]", f);
  }
  url.searchParams.append("sort[]", sort);
  url.searchParams.set("rows", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  url.searchParams.set("output", "json");

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Archive search ${res.status}`);
  const { response } = (await res.json()) as { response: { numFound: number; docs: Doc[] } };
  return {
    results: response.docs.map(toMovie),
    page,
    totalPages: Math.min(Math.ceil(response.numFound / PAGE_SIZE), 100),
  };
}

function parseLength(length: string | undefined): number | null {
  if (!length) return null;
  const parts = length.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  const seconds = parts.length > 1 ? parts.reduce((acc, n) => acc * 60 + n, 0) : parts[0];
  return seconds ? Math.round(seconds / 60) : null;
}

type ArchiveFile = { name: string; format?: string; length?: string; size?: string };
const ALL_SECTIONS = Object.keys(SCOPES) as SectionId[];

export const archiveProvider: MovieProvider = {
  id: "archive",
  attribution: "Public-domain films from the Internet Archive.",

  categories: () => ["latest", "top-rated", "popular"],

  async genres(section) {
    return GENRES_BY_SECTION[section].map(({ id, name, slug }) => ({ id, name, slug }));
  },

  bounds(): FilterBounds {
    return { yearMin: YEAR_MIN, yearMax: yearMax() };
  },

  languages: () => [],
  countries: () => COUNTRIES.map(({ code, name }) => ({ code, name })),

  async list(section, category, page, filters) {
    return search(buildQuery(section, filters), filters.sort ? sortKeyMap[filters.sort] : sortFor[category], page);
  },

  async search(query, page) {
    const clean = query.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
    if (!clean) return { results: [], page, totalPages: 0 };
    // Global: any section's slice of the archive
    const scopes = ALL_SECTIONS.map((s) => `(${scopeQuery(s)})`).join(" OR ");
    return search(`(${scopes}) AND (title:(${clean}) OR subject:(${clean}))`, "downloads desc", page);
  },

  async detail(_kind: ItemKind, id) {
    if (!/^[\w.-]+$/.test(id)) return null;
    const res = await fetch(`https://archive.org/metadata/${id}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { metadata?: Doc & { licenseurl?: string }; files?: ArchiveFile[] };
    if (!data.metadata) return null;

    const mp4s = (data.files ?? []).filter((f) => /\.mp4$/i.test(f.name));
    const file = mp4s.find((f) => f.format === "h.264") ?? mp4s.find((f) => f.format === "MPEG4") ?? mp4s[0];
    if (!file) return null;

    const meta = data.metadata;
    const subjects = list(meta.subject).flatMap((s) => s.split(/[;,]/)).map((s) => s.trim()).filter(Boolean);
    const similarQuery = subjects[0]
      ? `${scopeQuery("movies")} AND subject:"${subjects[0].replace(/"/g, "")}" AND NOT identifier:${id}`
      : scopeQuery("movies");
    const similar = await search(similarQuery, "downloads desc", 1).catch(() => null);

    return {
      ...toMovie({ ...meta, identifier: id }),
      tagline: "",
      runtime: parseLength(file.length),
      status: meta.licenseurl?.includes("publicdomain") ? "Public domain" : "",
      genres: subjects.slice(0, 4),
      directors: list(meta.creator).slice(0, 2),
      cast: [],
      playback: {
        kind: "file",
        url: `https://archive.org/download/${id}/${file.name.split("/").map(encodeURIComponent).join("/")}`,
        label: "Full film",
      },
      similar: similar?.results.slice(0, 10) ?? [],
    };
  },
};
