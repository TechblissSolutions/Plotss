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
  bust(); revalidatePath("/admin/listings");
}
export async function decideDocument(f: FormData) {
  await requireAdmin();
  const status = s(f, "status");
  if (!["verified", "rejected", "pending"].includes(status)) return;
  await setDocumentStatus(s(f, "id", 64), status as "verified", s(f, "ref", 120));
  bust(); revalidatePath("/admin/listings");
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
