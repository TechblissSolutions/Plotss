import type { MetadataRoute } from "next";
import { getSeoGlobal } from "@/lib/seo";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const g = await getSeoGlobal();
  if (g.noindexAll) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/api", "/search?"] },
    sitemap: `${g.siteUrl}/sitemap.xml`,
  };
}
