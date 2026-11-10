const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type ImageSize = "w185" | "w342" | "w500" | "w780" | "w1280";

/** Accepts a TMDB relative path or an absolute URL. */
export function imageUrl(path: string | null, size: ImageSize): string | null {
  if (!path) return null;
  return path.startsWith("http") ? path : `${TMDB_IMAGE_BASE}/${size}${path}`;
}

/** Only TMDB images go through the Next.js optimizer. */
export function isOptimizable(src: string): boolean {
  return src.startsWith(TMDB_IMAGE_BASE);
}
