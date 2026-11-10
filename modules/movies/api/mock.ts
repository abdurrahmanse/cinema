import type { Movie, MovieDetail, MovieProvider, Paginated } from "../types";

// Demo data used only when MOVIE_API_TOKEN is not configured.
const titles: [string, string, string, number][] = [
  ["The Last Projectionist", "2026-10-24", "An aging projectionist guards the final reel of a lost masterpiece as the theatre faces demolition.", 8.4],
  ["Winter Overture", "2026-09-12", "A conductor returns to her snowbound hometown to stage one last symphony.", 7.9],
  ["Paper Lanterns", "2026-11-01", "Three generations gather for a festival that will change the family forever.", 7.6],
  ["Meridian", "2026-08-30", "A cartographer discovers a coastline that appears on no map.", 8.1],
  ["The Quiet Hours", "2026-07-18", "A night-shift nurse and a poet share a city that never sleeps.", 7.3],
  ["Gilded Hour", "2026-10-03", "A jewel heist in 1920s Paris unravels through the eyes of a single witness.", 8.0],
  ["Salt & Cedar", "2026-06-21", "Two rival bakers are forced to share a kitchen on a remote island.", 7.1],
  ["Harbor Light", "2026-11-20", "A lighthouse keeper's daughter returns to settle a decades-old debt.", 7.8],
  ["Ashes of Velvet", "2026-12-05", "A fading cabaret star plans one final, extravagant performance.", 8.2],
  ["North of Summer", "2026-12-18", "Four friends set out on a road trip chasing the last of the light.", 7.5],
  ["The Clockmaker's Daughter", "2027-01-09", "A mechanical heart and a village secret collide in Edwardian England.", 7.7],
  ["Nocturne in Blue", "2027-02-14", "A jazz pianist searches for the one melody she can't remember.", 8.3],
];

const movies: Movie[] = titles.map(([title, releaseDate, overview, rating], i) => ({
  id: 900000 + i,
  title,
  overview,
  posterPath: null,
  backdropPath: null,
  releaseDate,
  rating,
  voteCount: 1200 + i * 137,
}));

function paginate(items: Movie[], page: number): Paginated<Movie> {
  const size = 8;
  return {
    results: items.slice((page - 1) * size, page * size),
    page,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  };
}

export const mockProvider: MovieProvider = {
  async list(category, page) {
    const sorted =
      category === "top-rated" ? [...movies].sort((a, b) => b.rating - a.rating)
      : category === "upcoming" ? [...movies].sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""))
      : movies;
    return paginate(sorted, page);
  },
  async search(query, page) {
    const q = query.toLowerCase();
    return paginate(movies.filter((m) => m.title.toLowerCase().includes(q)), page);
  },
  async detail(id) {
    const movie = movies.find((m) => m.id === id);
    if (!movie) return null;
    return {
      ...movie,
      tagline: "A demo film.",
      runtime: 118,
      status: "Released",
      genres: ["Drama"],
      directors: ["Demo Director"],
      cast: [],
      trailerKey: null,
      similar: movies.filter((m) => m.id !== id).slice(0, 6),
    } satisfies MovieDetail;
  },
};
