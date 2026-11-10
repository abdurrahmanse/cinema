import type { MetadataRoute } from "next";
import { sectionHref, sectionList } from "@/modules/movies/sections";
import { categoriesFor } from "@/modules/movies/services/movie-service";
import { siteUrl } from "@/shared/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const browse = sectionList.flatMap((s) =>
    categoriesFor(s.id)
      .filter((c) => c !== "trending")
      .map((c) => ({ url: `${siteUrl}${sectionHref(s.id, c)}`, changeFrequency: "hourly" as const, priority: c === "latest" ? 0.9 : 0.7 })),
  );
  const pages = ["/about", "/terms", "/privacy", "/copyright"].map((p) => ({
    url: `${siteUrl}${p}`,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  }));
  return [{ url: siteUrl, changeFrequency: "hourly" as const, priority: 1 }, ...browse, ...pages];
}
