import { NextResponse } from "next/server";
import { searchMovies } from "@/modules/movies/services/movie-service";

export type SearchSuggestion = {
  id: string;
  title: string;
  year: string | null;
  posterPath: string | null;
  rating: number;
};

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (q.length < 2) return NextResponse.json({ q, results: [] satisfies SearchSuggestion[] });

  try {
    const { results } = await searchMovies(q, 1);
    const suggestions: SearchSuggestion[] = results.slice(0, 6).map((m) => ({
      id: m.id,
      title: m.title,
      year: m.releaseDate ? m.releaseDate.slice(0, 4) : null,
      posterPath: m.posterPath,
      rating: m.rating,
    }));
    return NextResponse.json({ q, results: suggestions });
  } catch {
    return NextResponse.json({ q, results: [] satisfies SearchSuggestion[] }, { status: 502 });
  }
}
