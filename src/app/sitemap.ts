import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/db/blog";
import { getLiveListings } from "@/lib/db/listings";
import { getSeoGlobal } from "@/lib/seo";
import { getCities } from "@/lib/db/cities";
import { CATEGORY_LIST } from "@/ui/data/taxonomy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [g, listings, posts, cityRows] = await Promise.all([getSeoGlobal(), getLiveListings(), getPublishedPosts(), getCities()]);
  const u = (p: string) => `${g.siteUrl}${p}`;
  return [
    { url: u("/"), priority: 1 }, { url: u("/search"), priority: 0.8 }, { url: u("/blog"), priority: 0.6 }, { url: u("/post-listing"), priority: 0.5 },
    ...["about", "contact", "faq", "terms", "privacy", "rera-disclaimer"].map((p) => ({ url: u(`/${p}`), priority: 0.4 })),
    ...cityRows.map((c) => ({ url: u(`/city/${c.slug}`), priority: 0.8 })),
    ...CATEGORY_LIST.map((c) => ({ url: u(`/category/${c.slug}`), priority: 0.8 })),
    ...listings.map((l) => ({ url: u(`/listing/${l.slug}`), lastModified: l.createdAt, priority: 0.7 })),
    ...posts.map((p) => ({ url: u(`/blog/${p.slug}`), lastModified: p.updatedAt, priority: 0.5 })),
  ];
}
