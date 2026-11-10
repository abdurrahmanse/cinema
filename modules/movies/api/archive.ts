import type { Genre, Movie, MovieCategory, MovieProvider, Paginated } from "../types";

// Internet Archive: keyless, full-length public-domain films that stream directly.
const SEARCH_URL = "https://archive.org/advancedsearch.php";
const PAGE_SIZE = 20;

const BASE_QUERY = [
  "collection:feature_films",
  "mediatype:movies",
  "format:(h.264 OR MPEG4)",
  "year:[1920 TO 2030]",
  "downloads:[2000 TO 99999999]",
  "NOT subject:(exploitation OR erotic OR nudist OR sexploitation OR porn OR xxx OR adult)",
].join(" AND ");

const sortFor: Record<MovieCategory, string> = {
  trending: "downloads desc",
  popular: "downloads desc",
  "top-rated": "avg_rating desc",
  latest: "year desc",
  upcoming: "year desc",
};

const GENRES: (Genre & { subject: string })[] = [
  { id: "drama", name: "Drama", subject: "drama" },
  { id: "comedy", name: "Comedy", subject: "comedy" },
  { id: "film-noir", name: "Film Noir", subject: "film noir" },
  { id: "horror", name: "Horror", subject: "horror" },
  { id: "sci-fi", name: "Science Fiction", subject: "science fiction" },
  { id: "western", name: "Western", subject: "western" },
  { id: "crime", name: "Crime", subject: "crime" },
  { id: "romance", name: "Romance", subject: "romance" },
  { id: "mystery", name: "Mystery", subject: "mystery" },
  { id: "war", name: "War", subject: "war" },
  { id: "animation", name: "Animation", subject: "animation" },
  { id: "documentary", name: "Documentary", subject: "documentary" },
];

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

export const archiveProvider: MovieProvider = {
  id: "archive",
  attribution: "Public-domain films from the Internet Archive.",
  categories: ["trending", "latest", "top-rated", "popular"],

  async genres() {
    return GENRES.map(({ id, name }) => ({ id, name }));
  },

  async list(category, page, genre) {
    const subject = GENRES.find((g) => g.id === genre)?.subject;
    const q = subject ? `${BASE_QUERY} AND subject:"${subject}"` : BASE_QUERY;
    return search(q, sortFor[category], page);
  },

  async search(query, page) {
    const clean = query.replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
    if (!clean) return { results: [], page, totalPages: 0 };
    return search(`${BASE_QUERY} AND (title:(${clean}) OR subject:(${clean}))`, "downloads desc", page);
  },

  async detail(id) {
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
      ? `${BASE_QUERY} AND subject:"${subjects[0].replace(/"/g, "")}" AND NOT identifier:${id}`
      : BASE_QUERY;
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
