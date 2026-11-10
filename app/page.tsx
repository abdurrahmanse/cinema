import { Suspense } from "react";
import { ContinueWatching } from "@/modules/library/continue-watching";
import { BillboardSection, BillboardSkeleton } from "@/modules/movies/components/billboard-section";
import { RailRow } from "@/modules/movies/components/rail-row";
import { RailSkeleton } from "@/modules/movies/components/rail-carousel";
import { rails } from "@/modules/movies/rails";
import { providerInfo } from "@/modules/movies/services/movie-service";

export default function HomePage() {
  const rows = rails.filter((r) => r.sources.includes(providerInfo.id));
  return (
    <>
      <Suspense fallback={<BillboardSkeleton />}>
        <BillboardSection />
      </Suspense>
      <div className="relative z-10 -mt-12 pb-8 md:-mt-16">
        <ContinueWatching />
        {rows.map((def) => (
          <Suspense key={def.id} fallback={<RailSkeleton title={def.title} />}>
            <RailRow def={def} />
          </Suspense>
        ))}
      </div>
    </>
  );
}
