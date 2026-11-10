import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { categoryMeta, isCategory } from "@/modules/movies/categories";
import { BrowseView } from "@/modules/movies/components/browse-view";
import { MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { isSection, sections } from "@/modules/movies/sections";
import { categoriesFor } from "@/modules/movies/services/movie-service";
import { Container } from "@/shared/ui/container";

export async function generateMetadata({ params }: PageProps<"/[section]/[category]">): Promise<Metadata> {
  const { section, category } = await params;
  return isSection(section) && isCategory(category)
    ? { title: `${categoryMeta[category].title} · ${sections[section].title}` }
    : {};
}

async function Content({ params, searchParams }: Pick<PageProps<"/[section]/[category]">, "params" | "searchParams">) {
  const { section, category } = await params;
  if (!isSection(section) || !isCategory(category) || !categoriesFor(section).includes(category)) notFound();
  return <BrowseView section={section} category={category} searchParams={searchParams} />;
}

export default function SectionCategoryPage(props: PageProps<"/[section]/[category]">) {
  return (
    <Suspense fallback={<Container className="pb-24 pt-32"><MovieGridSkeleton /></Container>}>
      <Content params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
