const IMAGE_BASE = "https://image.tmdb.org/t/p";

export type ImageSize = "w185" | "w342" | "w500" | "w780" | "w1280";

export function imageUrl(path: string | null, size: ImageSize): string | null {
  return path ? `${IMAGE_BASE}/${size}${path}` : null;
}
