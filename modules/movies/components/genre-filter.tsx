import Link from "next/link";
import { buttonVariants } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import { getGenres } from "../services/movie-service";

export async function GenreFilter({ basePath, active }: { basePath: string; active?: string }) {
  const genres = await getGenres();
  const chip = (on: boolean) =>
    cn(buttonVariants({ variant: on ? "default" : "subtle", size: "sm" }), "tracking-[0.2em]");
  return (
    <nav aria-label="Filter by genre" className="mb-12 flex flex-wrap gap-2">
      <Link href={basePath} className={chip(!active)} aria-current={!active ? "true" : undefined}>
        All
      </Link>
      {genres.map((g) => (
        <Link
          key={g.id}
          href={`${basePath}?genre=${g.id}`}
          className={chip(active === g.id)}
          aria-current={active === g.id ? "true" : undefined}
        >
          {g.name}
        </Link>
      ))}
    </nav>
  );
}

export function GenreFilterSkeleton() {
  return <Skeleton className="mb-12 h-9 w-full max-w-xl" aria-hidden />;
}
