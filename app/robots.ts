import type { MetadataRoute } from "next";
import { siteUrl } from "@/shared/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/my-list"] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
