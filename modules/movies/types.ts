export type SectionId = "movies" | "serials" | "cartoons" | "drama";

/** Which detail route an item belongs to */
export type ItemKind = "movie" | "tv";

export type Movie = {
  id: string;
  kind: ItemKind;
  title: string;
  overview: string;
  /** TMDB relative path or an absolute image URL */
  posterPath: string | null;
  backdropPath: string | null;
  /** ISO date or just a year ("1961") */
  releaseDate: string | null;
  rating: number; // 0–10
  voteCount: number;
};

export type CastMember = {
  id: string;
  name: string;
  character: string;
};

export type Playback =
  | { kind: "file"; url: string; label: string }
  | { kind: "hls"; url: string; label: string }
  | { kind: "youtube"; key: string; label: string };

export type MovieDetail = Movie & {
  tagline: string;
  runtime: number | null;
  status: string;
  genres: string[];
  directors: string[];
  cast: CastMember[];
  /** What the player plays: full film, or the trailer as a fallback */
  playback: Playback | null;
  similar: Movie[];
};

export type Paginated<T> = {
  results: T[];
  page: number;
  totalPages: number;
};

export type Genre = { id: string; name: string; slug: string };

export type SortKey = "popularity" | "rating" | "newest" | "oldest";

/** All fields optional except genres; plain/serializable so it can key the cache. */
export type MovieFilters = {
  genres: string[]; // match ANY of these
  yearFrom?: number;
  yearTo?: number;
  minRating?: number; // 0–10
  language?: string; // original language code (TMDB only)
  country?: string; // country code (see provider.countries())
  sort?: SortKey;
};

export type Language = { code: string; name: string };

export type Country = { code: string; name: string };

export type FilterBounds = { yearMin: number; yearMax: number };

export type MovieCategory = "trending" | "latest" | "upcoming" | "top-rated" | "popular";

export type MovieProvider = {
  id: "tmdb" | "archive";
  /** Short note shown in the footer */
  attribution: string;
  /** Collections (tabs) this source can serve inside a section */
  categories(section: SectionId): readonly MovieCategory[];
  /** Genres / themes that make sense for the section */
  genres(section: SectionId): Promise<Genre[]>;
  bounds(): FilterBounds;
  /** Empty when the source cannot filter by language / country */
  languages(): Language[];
  countries(): Country[];
  list(section: SectionId, category: MovieCategory, page: number, filters: MovieFilters): Promise<Paginated<Movie>>;
  /** Global search across every section */
  search(query: string, page: number): Promise<Paginated<Movie>>;
  detail(kind: ItemKind, id: string): Promise<MovieDetail | null>;
};
