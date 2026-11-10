export type Movie = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  rating: number; // 0–10
  voteCount: number;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
};

export type MovieDetail = Movie & {
  tagline: string;
  runtime: number | null;
  status: string;
  genres: string[];
  directors: string[];
  cast: CastMember[];
  trailerKey: string | null;
  similar: Movie[];
};

export type Paginated<T> = {
  results: T[];
  page: number;
  totalPages: number;
};

export type MovieCategory = "trending" | "now-playing" | "upcoming" | "top-rated" | "popular";

export type MovieProvider = {
  list(category: MovieCategory, page: number): Promise<Paginated<Movie>>;
  search(query: string, page: number): Promise<Paginated<Movie>>;
  detail(id: number): Promise<MovieDetail | null>;
};
