import type { MovieCategory, SectionId } from "./types";

/** Controls a section's filter bar can show. Each section picks its own set. */
export type Control = "sort" | "year" | "yearChips" | "decade" | "rating" | "country" | "language" | "genre";

export type SectionDef = {
  id: SectionId;
  title: string;
  nav: string;
  blurb: string;
  controls: readonly Control[];
  /** First decade offered as a quick-pick chip */
  decadeFrom: number;
  /** First year offered as a per-year chip (when "yearChips" is enabled) */
  yearChipsFrom: number;
  genreLabel: string;
};

export const sections: Record<SectionId, SectionDef> = {
  movies: {
    id: "movies",
    title: "Movies",
    nav: "Movies",
    blurb: "Full-length feature films from every era, updated automatically.",
    controls: ["sort", "year", "yearChips", "decade", "rating", "country", "language", "genre"],
    decadeFrom: 2000,
    yearChipsFrom: 2000,
    genreLabel: "Genres",
  },
  serials: {
    id: "serials",
    title: "Serials",
    nav: "Serials",
    blurb: "Series, serials and episodes to follow week after week.",
    controls: ["sort", "year", "decade", "rating", "country", "language", "genre"],
    decadeFrom: 1950,
    yearChipsFrom: 2000,
    genreLabel: "Genres",
  },
  cartoons: {
    id: "cartoons",
    title: "Cartoons",
    nav: "Cartoons",
    blurb: "Animated films and classic cartoons for every age.",
    controls: ["sort", "year", "decade", "rating", "country", "genre"],
    decadeFrom: 1920,
    yearChipsFrom: 2000,
    genreLabel: "Themes",
  },
  drama: {
    id: "drama",
    title: "Drama",
    nav: "Drama",
    blurb: "Televised drama and theatre — stories told in many parts.",
    controls: ["sort", "year", "yearChips", "rating", "country", "language", "genre"],
    decadeFrom: 1950,
    yearChipsFrom: 2000,
    genreLabel: "Drama types",
  },
};

export const sectionList = Object.values(sections);

export function isSection(value: string): value is SectionId {
  return value in sections;
}

/** Canonical URL of a section tab. Movies → Latest is the home page. */
export function sectionHref(section: SectionId, category: MovieCategory): string {
  if (section === "movies" && category === "latest") return "/";
  if (category === "latest") return `/${section}`;
  return `/${section}/${category}`;
}
