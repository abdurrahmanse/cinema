import type { MovieCategory } from "./types";

export const categoryMeta: Record<MovieCategory, { title: string; nav: string; blurb: string }> = {
  trending: { title: "Trending", nav: "Trending", blurb: "What the world is watching right now." },
  latest: { title: "Latest Releases", nav: "Latest", blurb: "The newest films, added automatically." },
  upcoming: { title: "Coming Soon", nav: "Upcoming", blurb: "Arriving in the weeks ahead." },
  "top-rated": { title: "Top Rated", nav: "Top Rated", blurb: "The most admired films of all time." },
  popular: { title: "Popular", nav: "Popular", blurb: "Films audiences keep returning to." },
};

const all = Object.keys(categoryMeta) as MovieCategory[];

export function isCategory(value: string): value is MovieCategory {
  return (all as string[]).includes(value);
}
