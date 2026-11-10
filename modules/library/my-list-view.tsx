"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { MovieCard } from "@/modules/movies/components/movie-card";
import { Button } from "@/shared/ui/button";
import { useMyList } from "./store";

export function MyListView() {
  const list = useMyList();

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border py-24 text-center">
        <Bookmark className="size-10 text-primary" />
        <p className="font-display text-3xl font-bold">Your list is empty.</p>
        <p className="max-w-md text-muted-foreground">Tap the + on any title to keep it here. Your list is saved on this device.</p>
        <Button asChild size="lg"><Link href="/">Browse titles</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {list.map((item) => (
        <MovieCard key={`${item.kind}:${item.id}`} movie={{ ...item, overview: "", backdropPath: null, voteCount: 0 }} />
      ))}
    </div>
  );
}
