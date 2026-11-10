import { Suspense } from "react";
import { BrowseView } from "@/modules/movies/components/browse-view";
import { MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { Container } from "@/shared/ui/container";

export default function HomePage(props: PageProps<"/">) {
  return (
    <Suspense
      fallback={
        <Container className="pb-24 pt-32">
          <MovieGridSkeleton />
        </Container>
      }
    >
      <BrowseView category="latest" searchParams={props.searchParams} showSearch />
    </Suspense>
  );
}
