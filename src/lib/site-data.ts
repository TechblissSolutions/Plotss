import "server-only";
import { unstable_cache } from "next/cache";
import { getPublishedPosts } from "@/lib/db/blog";
import { getCities } from "@/lib/db/cities";
import { cityCards, getBrokers, getLiveListings } from "@/lib/db/listings";
import { getContent } from "@/lib/content/store";
import { getFeatures } from "@/lib/features";
import type { BlogCard, SiteData } from "@/ui/data/DataProvider";

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
const readTime = (body: string) => `${Math.max(1, Math.round(body.split(/\s+/).length / 200))} min read`;

async function load(): Promise<SiteData> {
  const [listings, brokers, posts, content, cityRows, features] = await Promise.all([
    getLiveListings(), getBrokers(), getPublishedPosts(3), getContent(), getCities(), getFeatures(),
  ]);
  const cities = cityCards(listings, cityRows);
  const categoryCounts: Record<string, number> = {};
  for (const l of listings) categoryCounts[l.category] = (categoryCounts[l.category] ?? 0) + 1;

  // Stats are computed from live data. The admin can override each one with custom text (Content > home.stats.*).
  const t = content.texts;
  const stats = {
    // "Verified" only counts when staff verification is switched on; otherwise show all live listings.
    plots: t["home.stats.plots"] || String(features.humanReview ? listings.filter((l) => l.verified).length : listings.length),
    cities: t["home.stats.cities"] || String(cities.length),
    deals: t["home.stats.deals"] || String(0),
  };
  const blog: BlogCard[] = posts.map((p) => ({
    id: p.id, slug: p.slug, title: p.title, tag: p.tags[0] ?? "Insights", date: fmtDate(p.publishedAt),
    readTime: readTime(p.body), excerpt: p.excerpt,
  }));
  return {
    listings, brokers: features.brokers ? brokers : [], cities, blog, stats, categoryCounts, features,
    cityList: cityRows.map((c) => ({ slug: c.slug, name: c.name })),
  };
}

export const getSiteData = unstable_cache(load, ["site-data"], { tags: ["site-data", "content", "features"], revalidate: 120 });
