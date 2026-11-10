import type { MovieCategory } from "./types";

export const browsableCategories = ["now-playing", "upcoming", "top-rated", "popular"] as const;
export type BrowsableCategory = (typeof browsableCategories)[number];

export const categoryMeta: Record<MovieCategory, { title: string; blurb: string }> = {
  trending: { title: "Trending This Week", blurb: "What the world is watching right now." },
  "now-playing": { title: "Now Playing", blurb: "Currently in cinemas." },
  upcoming: { title: "Coming Soon", blurb: "Arriving in the weeks ahead." },
  "top-rated": { title: "Top Rated", blurb: "The most admired films of all time." },
  popular: { title: "Popular", blurb: "Films audiences keep returning to." },
};

export function isBrowsableCategory(value: string): value is BrowsableCategory {
  return (browsableCategories as readonly string[]).includes(value);
}
