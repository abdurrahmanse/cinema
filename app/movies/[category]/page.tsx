import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryMeta, isCategory } from "@/modules/movies/categories";
import { BrowseView } from "@/modules/movies/components/browse-view";
import { MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { providerInfo } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";

export function generateStaticParams() {
  return providerInfo.categories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps<"/movies/[category]">): Promise<Metadata> {
  const { category } = await params;
  return isCategory(category) ? { title: categoryMeta[category].title } : {};
}

async function CategoryContent({ params, searchParams }: Pick<PageProps<"/movies/[category]">, "params" | "searchParams">) {
  const { category } = await params;
  if (!isCategory(category) || !providerInfo.categories.includes(category)) notFound();
  return <BrowseView category={category} searchParams={searchParams} />;
}

export default function CategoryPage(props: PageProps<"/movies/[category]">) {
  return (
    <Suspense fallback={<Container className="pb-24 pt-32"><MovieGridSkeleton /></Container>}>
      <CategoryContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
