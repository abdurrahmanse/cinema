import type { MovieCategory, MovieFilters, SectionId } from "./types";

export type RailDef = {
  id: string;
  title: string;
  section: SectionId;
  category: MovieCategory;
  /** Genre slug candidates (first one that exists in the provider wins) */
  genreSlugs?: string[];
  language?: string;
  /** Numbered "Top 10" style */
  ranked?: boolean;
  /** Which data sources can serve this row */
  sources: ("tmdb" | "archive")[];
};

const both: RailDef["sources"] = ["tmdb", "archive"];
const tmdb: RailDef["sources"] = ["tmdb"];
const archive: RailDef["sources"] = ["archive"];

/** Home page rows, in order. The billboard uses movies/trending separately. */
export const rails: RailDef[] = [
  { id: "top10", title: "Top 10 Today", section: "movies", category: "trending", ranked: true, sources: both },
  { id: "latest", title: "Latest Releases", section: "movies", category: "latest", sources: both },
  { id: "indian-latest", title: "Latest Indian Movies", section: "indian", category: "latest", sources: both },
  { id: "hindi", title: "Hindi Movies", section: "indian", category: "popular", language: "hi", sources: tmdb },
  { id: "tamil", title: "Tamil Movies", section: "indian", category: "popular", language: "ta", sources: tmdb },
  { id: "telugu", title: "Telugu Movies", section: "indian", category: "popular", language: "te", sources: tmdb },
  { id: "bengali", title: "Bengali Movies", section: "indian", category: "popular", language: "bn", sources: tmdb },
  { id: "malayalam", title: "Malayalam Movies", section: "indian", category: "popular", language: "ml", sources: tmdb },
  { id: "series", title: "Popular Series", section: "serials", category: "popular", sources: both },
  { id: "upcoming", title: "Coming Soon", section: "movies", category: "upcoming", sources: tmdb },
  { id: "top-rated", title: "Top Rated", section: "movies", category: "top-rated", sources: both },
  { id: "action", title: "Action & Adventure", section: "movies", category: "popular", genreSlugs: ["action"], sources: both },
  { id: "comedy", title: "Comedies", section: "movies", category: "popular", genreSlugs: ["comedy"], sources: both },
  { id: "cartoons", title: "Cartoons & Animation", section: "cartoons", category: "popular", sources: both },
  { id: "drama-tv", title: "Drama Series", section: "drama", category: "popular", sources: both },
  { id: "scifi", title: "Sci-Fi & Fantasy", section: "movies", category: "popular", genreSlugs: ["science-fiction", "sci-fi"], sources: both },
  { id: "horror", title: "Horror", section: "movies", category: "popular", genreSlugs: ["horror"], sources: both },
  { id: "romance", title: "Romance", section: "movies", category: "popular", genreSlugs: ["romance"], sources: both },
  { id: "noir", title: "Film Noir Classics", section: "movies", category: "popular", genreSlugs: ["film-noir"], sources: archive },
  { id: "western", title: "Westerns", section: "movies", category: "popular", genreSlugs: ["western"], sources: both },
];

export type RailFilters = Pick<MovieFilters, "genres" | "language">;
