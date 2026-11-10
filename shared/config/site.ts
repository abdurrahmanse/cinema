export const siteConfig = {
  name: "Cinéma",
  tagline: "The finest in film, always current.",
  description:
    "A quiet, classical home for the latest films — updated automatically, nothing to upload.",
} as const;

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/movies/now-playing", label: "Now Playing" },
  { href: "/movies/upcoming", label: "Upcoming" },
  { href: "/movies/top-rated", label: "Top Rated" },
  { href: "/movies/popular", label: "Popular" },
] as const;
