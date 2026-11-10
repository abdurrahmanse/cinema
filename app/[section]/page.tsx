import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BrowseView } from "@/modules/movies/components/browse-view";
import { MovieGridSkeleton } from "@/modules/movies/components/movie-grid";
import { isSection, sectionList, sections } from "@/modules/movies/sections";
import { Container } from "@/shared/ui/container";

export function generateStaticParams() {
  return sectionList.map((s) => ({ section: s.id }));
}

export async function generateMetadata({ params }: PageProps<"/[section]">): Promise<Metadata> {
  const { section } = await params;
  return isSection(section) ? { title: sections[section].title, description: sections[section].blurb } : {};
}

async function Content({ params, searchParams }: Pick<PageProps<"/[section]">, "params" | "searchParams">) {
  const { section } = await params;
  if (!isSection(section)) notFound();
  return <BrowseView section={section} category="latest" searchParams={searchParams} />;
}

export default function SectionPage(props: PageProps<"/[section]">) {
  return (
    <Suspense fallback={<Container className="pb-24 pt-28"><MovieGridSkeleton /></Container>}>
      <Content params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
