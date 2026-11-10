export type Movie = {
  id: string;
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

export type Genre = { id: string; name: string };

export type MovieCategory = "trending" | "latest" | "upcoming" | "top-rated" | "popular";

export type MovieProvider = {
  id: "tmdb" | "archive";
  /** Short note shown in the footer/banner */
  attribution: string;
  /** Categories this source can serve */
  categories: readonly MovieCategory[];
  genres(): Promise<Genre[]>;
  list(category: MovieCategory, page: number, genre?: string): Promise<Paginated<Movie>>;
  search(query: string, page: number): Promise<Paginated<Movie>>;
  detail(id: string): Promise<MovieDetail | null>;
};
