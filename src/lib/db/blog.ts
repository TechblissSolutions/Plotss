import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { BLOG_POSTS } from "@/ui/data/mockData";
import { isDbReady } from "./listings";

export type Post = {
  id: string; slug: string; title: string; excerpt: string; body: string; cover: string | null; tags: string[];
  author: string; status: "draft" | "published"; publishedAt: string | null; updatedAt: string;
  seoTitle: string | null; seoDescription: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const map = (r: any): Post => ({
  id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt ?? "", body: r.body ?? "", cover: r.cover_image ?? null,
  tags: r.tags ?? [], author: r.author ?? "PLOTSS Editorial", status: r.status, publishedAt: r.published_at,
  updatedAt: r.updated_at ?? r.created_at, seoTitle: r.seo_title, seoDescription: r.seo_description,
});

const demo = (): Post[] =>
  BLOG_POSTS.map((b) => ({
    id: b.id, slug: b.id, title: b.title, excerpt: b.excerpt, body: b.excerpt, cover: null, tags: [b.tag], author: "PLOTSS Editorial",
    status: "published", publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), seoTitle: null, seoDescription: null,
  }));

export async function getPublishedPosts(limit?: number): Promise<Post[]> {
  if (!(await isDbReady())) return demo().slice(0, limit ?? 50);
  let q = createServiceClient().from("blog_posts").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data } = await q;
  return (data ?? []).map(map);
}

export async function getPost(slug: string, includeDraft = false): Promise<Post | null> {
  if (!(await isDbReady())) return demo().find((p) => p.slug === slug) ?? null;
  let q = createServiceClient().from("blog_posts").select("*").eq("slug", slug);
  if (!includeDraft) q = q.eq("status", "published");
  const { data } = await q.maybeSingle();
  return data ? map(data) : null;
}

export async function getAllPostsAdmin(): Promise<Post[]> {
  if (!(await isDbReady())) return [];
  const { data } = await createServiceClient().from("blog_posts").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(map);
}
