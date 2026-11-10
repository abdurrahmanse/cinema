import { Suspense } from "react";
import type { Metadata } from "next";
import { MoviePageContent, movieMetadata } from "@/modules/movies/components/movie-page";
import { Container } from "@/shared/ui/container";
import { Skeleton } from "@/shared/ui/skeleton";

export function generateMetadata({ params }: PageProps<"/tv/[id]">): Promise<Metadata> {
  return movieMetadata("tv", params);
}

export default function Page(props: PageProps<"/tv/[id]">) {
  return (
    <Suspense fallback={<Container className="pt-44"><Skeleton className="h-[60vh]" /></Container>}>
      <MoviePageContent kind="tv" params={props.params} />
    </Suspense>
  );
}
