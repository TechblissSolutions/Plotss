"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient, logAdminAction, setBrokerVerified, setClientStatus, setDocumentStatus, setListingStatus, setUserRole } from "@/lib/db/admin";
import { getSession } from "@/lib/session";
import { writeContent } from "@/lib/content/store";
import { screenAndStore } from "@/lib/ai/screen";
import { writeFeatures } from "@/lib/features";
import { createServiceClient } from "@/lib/supabase/service";
import type { Role } from "@/lib/types";
import type { ContentState } from "@/ui/content";

const s = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);
const bust = () => { updateTag("site-data"); updateTag("content"); updateTag("seo"); };

/* ---------- listings ---------- */
export async function decideListing(f: FormData) {
  await requireAdmin();
  const status = s(f, "status");
  if (!["live", "rejected", "draft", "pending", "sold"].includes(status)) return;
  const listingId = s(f, "id", 64);
  await setListingStatus(listingId, status as "live", s(f, "note", 500));
  const session = await getSession();
  if (session) {
    const actionName = status === "live" ? "approve_listing" : status === "rejected" ? "reject_listing" : `set_listing_${status}`;
    await logAdminAction(session.id, actionName, "listing", listingId, { status, note: s(f, "note", 500) || undefined });
  }
  bust();
  revalidatePath("/admin/listings");
  revalidatePath("/admin/verification");
}
export async function decideDocument(f: FormData) {
  await requireAdmin();
  const status = s(f, "status");
  if (!["verified", "rejected", "pending", "action_required"].includes(status)) return;
  const docId = s(f, "id", 64);
  await setDocumentStatus(docId, status as "verified", s(f, "ref", 120));
  const session = await getSession();
  if (session) {
    await logAdminAction(session.id, `doc_${status}`, "verification_document", docId, {
      status,
      ref: s(f, "ref", 120) || undefined,
    });
  }
  bust();
  revalidatePath("/admin/listings");
  revalidatePath("/admin/verification");
}

/* ---------- users ---------- */
export async function changeRole(f: FormData) {
  await requireAdmin();
  const role = s(f, "role") as Role;
  if (!["buyer", "seller", "broker", "admin"].includes(role)) return;
  const brokerId = s(f, "brokerId", 64);
  await setUserRole(s(f, "id", 64), role, brokerId || null);
  bust(); revalidatePath("/admin/users");
}
export async function verifyBroker(f: FormData) {
  await requireAdmin();
  await setBrokerVerified(s(f, "id", 64), s(f, "verified") === "true");
  bust(); revalidatePath("/admin/users");
}

/* ---------- capabilities ---------- */
export async function adminGrantCapabilityAction(f: FormData): Promise<void> {
  await requireAdmin();
  const userId = s(f, "userId", 64);
  const capability = s(f, "capability", 32) as "can_sell" | "is_broker_staff";
  const brokerId = s(f, "brokerId", 64) || undefined;
  if (!["can_sell", "is_broker_staff"].includes(capability)) return;
  const { addCapabilityAction } = await import("@/app/(app)/actions");
  await addCapabilityAction(userId, capability, brokerId);
  const session = await getSession();
  if (session) await logAdminAction(session.id, "grant_capability", "capability", undefined, { userId, capability, brokerId });
  bust(); revalidatePath("/admin/users");
}
export async function adminRevokeCapabilityAction(f: FormData): Promise<void> {
  await requireAdmin();
  const userId = s(f, "userId", 64);
  const capability = s(f, "capability", 32) as "can_sell" | "is_broker_staff";
  if (!["can_sell", "is_broker_staff"].includes(capability)) return;
  const { removeCapabilityAction } = await import("@/app/(app)/actions");
  await removeCapabilityAction(userId, capability);
  const session = await getSession();
  if (session) await logAdminAction(session.id, "revoke_capability", "capability", undefined, { userId, capability });
  bust(); revalidatePath("/admin/users");
}

/* ---------- clients ---------- */
export async function createClientAction(f: FormData) {
  await requireAdmin();
  const name = s(f, "name", 120);
  if (!name) throw new Error("Name is required");
  await createClient(name, s(f, "firmName", 120));
  bust(); revalidatePath("/admin/clients");
}
export async function setClientStatusAction(f: FormData) {
  await requireAdmin();
  const status = s(f, "status");
  if (!["active", "suspended"].includes(status)) return;
  await setClientStatus(s(f, "id", 64), status as "active" | "suspended");
  bust(); revalidatePath("/admin/clients");
}

/* ---------- content ---------- */
export async function saveContentAction(state: ContentState) {
  await requireAdmin();
  const saved = await writeContent(state);
  bust();
  return saved;
}

/* ---------- SEO ---------- */
export async function saveSeoGlobal(f: FormData) {
  await requireAdmin();
  const value = {
    siteName: s(f, "siteName", 60), titleTemplate: s(f, "titleTemplate", 80), description: s(f, "description", 320),
    ogImage: s(f, "ogImage", 500), twitter: s(f, "twitter", 60), siteUrl: s(f, "siteUrl", 200),
    orgName: s(f, "orgName", 100), orgLogo: s(f, "orgLogo", 500), orgPhone: s(f, "orgPhone", 30), orgEmail: s(f, "orgEmail", 100),
    sameAs: s(f, "sameAs", 1500).split(/\s*[\n,]\s*/).filter((u) => /^https?:\/\//.test(u)),
    noindexAll: f.get("noindexAll") === "on",
  };
  const { error } = await createServiceClient().from("site_settings").upsert({ key: "seo_global", value, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  bust(); revalidatePath("/admin/seo");
}

const parseFaq = (raw: string) =>
  raw.split("\n").map((l) => l.split("||")).filter((p) => p.length >= 2 && p[0].trim() && p[1].trim())
    .map((p) => ({ q: p[0].trim().slice(0, 200), a: p.slice(1).join("||").trim().slice(0, 1000) })).slice(0, 20);

export async function saveSeoRow(f: FormData) {
  await requireAdmin();
  const path = s(f, "path", 200);
  if (!/^(\/[a-z0-9/_\-.]*|tpl:[a-z]+)$/i.test(path)) throw new Error("Path must start with / (or tpl:property)");
  const row = {
    path, title: s(f, "title", 120) || null, description: s(f, "description", 320) || null, h1: s(f, "h1", 140) || null,
    intro: s(f, "intro", 4000) || null, og_image: s(f, "og_image", 500) || null,
    canonical: /^https?:\/\//.test(s(f, "canonical")) ? s(f, "canonical") : null,
    noindex: f.get("noindex") === "on", faq: parseFaq(s(f, "faq", 12000)), updated_at: new Date().toISOString(),
  };
  const { error } = await createServiceClient().from("seo_pages").upsert(row);
  if (error) throw new Error(error.message);
  bust(); revalidatePath("/admin/seo");
}
export async function deleteSeoRow(f: FormData) {
  await requireAdmin();
  await createServiceClient().from("seo_pages").delete().eq("path", s(f, "path", 200));
  bust(); revalidatePath("/admin/seo");
}

/* ---------- blog ---------- */
const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export async function saveBlog(f: FormData) {
  await requireAdmin();
  const id = s(f, "id", 64);
  const title = s(f, "title", 200);
  if (!title) throw new Error("Title is required");
  const status = s(f, "status") === "published" ? "published" : "draft";
  const row = {
    slug: slugify(s(f, "slug", 100) || title), title, excerpt: s(f, "excerpt", 400), body: s(f, "body", 60000),
    cover_image: s(f, "cover_image", 500) || null, tags: s(f, "tags", 200).split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8),
    author: s(f, "author", 80) || "PLOTSS Editorial", author_role: s(f, "author_role", 120) || null, author_bio: s(f, "author_bio", 300) || null,
    key_takeaways: s(f, "key_takeaways", 3000).split("\n").map((t) => t.trim()).filter(Boolean).slice(0, 8),
    faq: parseFaq(s(f, "faq", 12000)),
    status, seo_title: s(f, "seo_title", 120) || null,
    seo_description: s(f, "seo_description", 320) || null, updated_at: new Date().toISOString(),
    ...(status === "published" ? { published_at: s(f, "published_at") || new Date().toISOString() } : {}),
  };
  const svc = createServiceClient();
  const { error } = id ? await svc.from("blog_posts").update(row).eq("id", id) : await svc.from("blog_posts").insert(row);
  if (error) throw new Error(error.message);
  bust(); revalidatePath("/admin/blog"); revalidatePath("/blog");
  redirect("/admin/blog");
}
export async function deleteBlog(f: FormData) {
  await requireAdmin();
  await createServiceClient().from("blog_posts").delete().eq("id", s(f, "id", 64));
  bust(); revalidatePath("/admin/blog");
}

export async function publishBlog(f: FormData) {
  await requireAdmin();
  const id = s(f, "id", 64);
  await createServiceClient().from("blog_posts").update({ status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  bust(); revalidatePath("/admin/blog"); revalidatePath("/blog");
}

export async function unpublishBlog(f: FormData) {
  await requireAdmin();
  const id = s(f, "id", 64);
  await createServiceClient().from("blog_posts").update({ status: "draft", updated_at: new Date().toISOString() }).eq("id", id);
  bust(); revalidatePath("/admin/blog"); revalidatePath("/blog");
}

export async function duplicateBlog(f: FormData) {
  await requireAdmin();
  const id = s(f, "id", 64);
  const svc = createServiceClient();
  const { data } = await svc.from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!data) return;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, created_at: _ca, updated_at: _ua, published_at: _pa, ...rest } = data;
  await svc.from("blog_posts").insert({
    ...rest,
    slug: `${rest.slug}-copy-${Date.now().toString(36)}`,
    title: `${rest.title} (Copy)`,
    status: "draft",
    published_at: null,
    updated_at: new Date().toISOString(),
  });
  bust(); revalidatePath("/admin/blog");
}

export type ImportResult = { imported: number; skipped: number; errors: string[] };

export async function importBlogPosts(posts: unknown[]): Promise<ImportResult> {
  await requireAdmin();
  const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
  const svc = createServiceClient();
  const { data: existing } = await svc.from("blog_posts").select("slug");
  const existingSlugs = new Set((existing ?? []).map((r: { slug: string }) => r.slug));

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i] as Record<string, unknown>;
    const label = `Post ${i + 1}${p.slug ? ` (${p.slug})` : ""}`;
    if (!p.title || typeof p.title !== "string") { result.errors.push(`${label}: missing title`); continue; }
    if (!p.body || typeof p.body !== "string") { result.errors.push(`${label}: missing body`); continue; }
    const slug = (typeof p.slug === "string" && p.slug) ? slugify(p.slug) : slugify(String(p.title));
    if (existingSlugs.has(slug)) { result.skipped++; result.errors.push(`${label}: slug "${slug}" already exists — skipped`); continue; }
    const row = {
      slug, title: String(p.title).slice(0, 200),
      excerpt: typeof p.excerpt === "string" ? p.excerpt.slice(0, 400) : "",
      body: String(p.body).slice(0, 60000),
      cover_image: typeof p.cover_image === "string" && p.cover_image ? p.cover_image.slice(0, 500) : null,
      tags: Array.isArray(p.tags) ? p.tags.map(String).slice(0, 8) : [],
      author: typeof p.author === "string" && p.author ? p.author.slice(0, 80) : "PLOTSS Editorial",
      author_role: typeof p.author_role === "string" ? p.author_role.slice(0, 120) : null,
      author_bio: typeof p.author_bio === "string" ? p.author_bio.slice(0, 300) : null,
      key_takeaways: Array.isArray(p.key_takeaways) ? p.key_takeaways.map(String).slice(0, 8) : [],
      faq: Array.isArray(p.faq) ? p.faq.filter((f: unknown) => f && typeof f === "object" && "q" in (f as object) && "a" in (f as object)).slice(0, 20) : [],
      seo_title: typeof p.seo_title === "string" ? p.seo_title.slice(0, 120) : null,
      seo_description: typeof p.seo_description === "string" ? p.seo_description.slice(0, 320) : null,
      status: "draft" as const,
      published_at: null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await svc.from("blog_posts").insert(row);
    if (error) { result.errors.push(`${label}: ${error.message}`); } else { result.imported++; existingSlugs.add(slug); }
  }
  bust(); revalidatePath("/admin/blog"); revalidatePath("/blog");
  return result;
}

/* ---------- blog image upload (WebP) ---------- */
/* Images are always converted to WebP, resized to max 1920px wide, and clamped to 50–400 KB. */
export async function uploadBlogImage(f: FormData): Promise<{ url: string }> {
  await requireAdmin();
  const file = f.get("file") as File | null;
  if (!file || !file.size) throw new Error("No file provided");
  if (file.size > 8 * 1024 * 1024) throw new Error("Max upload size is 8 MB");

  const sharp = (await import("sharp")).default;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Convert to WebP, cap to 1920px wide, quality 82
  const webpBuf = await sharp(buffer)
    .rotate()                         // honour EXIF orientation
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  // Enforce 50 KB – 400 KB output
  const kb = webpBuf.byteLength / 1024;
  if (kb < 5) throw new Error("Image too small after conversion (< 5 KB)");
  if (kb > 500) throw new Error("Image too large after conversion (> 500 KB). Use a smaller source image.");

  const svc = createServiceClient();
  const name = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const { error } = await svc.storage.from("media").upload(name, webpBuf, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = svc.storage.from("media").getPublicUrl(name);
  return { url: data.publicUrl };
}

/* ---------- redirects ---------- */
export async function addRedirect(f: FormData) {
  await requireAdmin();
  const from = s(f, "from", 300), to = s(f, "to", 500);
  if (!from.startsWith("/") || from === "/" || !(to.startsWith("/") || /^https?:\/\//.test(to))) throw new Error("From must start with /, To must be a path or URL");
  if (from === to) throw new Error("From and To are the same");
  const { error } = await createServiceClient().from("redirects").upsert({ from_path: from, to_path: to, status_code: s(f, "code") === "302" ? 302 : 301 });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/redirects");
}
export async function deleteRedirect(f: FormData) {
  await requireAdmin();
  await createServiceClient().from("redirects").delete().eq("from_path", s(f, "from", 300));
  revalidatePath("/admin/redirects");
}

/* ---------- launch settings ---------- */
export async function saveFeaturesAction(f: FormData) {
  await requireAdmin();
  const on = (k: string) => f.get(k) === "on";
  await writeFeatures({
    collectDocuments: on("collectDocuments"), aiScreening: on("aiScreening"), humanReview: on("humanReview"), brokers: on("brokers"),
    tracking: on("tracking"), consentBanner: on("consentBanner"), unlockLimitPerDay: Number(f.get("unlockLimitPerDay")),
    notifyInApp: on("notifyInApp"), notifyEmail: on("notifyEmail"), notifyWhatsapp: on("notifyWhatsapp"),
  });
  updateTag("features"); bust();
  revalidatePath("/admin/settings");
}

export async function toggleCityAction(f: FormData) {
  await requireAdmin();
  const slug = s(f, "slug", 60);
  if (!/^[a-z0-9-]+$/.test(slug)) return;
  await createServiceClient().from("cities").update({ active: s(f, "active") === "true" }).eq("slug", slug);
  bust(); revalidatePath("/admin/settings");
}

export async function rerunScreenAction(f: FormData) {
  await requireAdmin();
  await screenAndStore(s(f, "id", 64));
  revalidatePath("/admin/listings");
}
