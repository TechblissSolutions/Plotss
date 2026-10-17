import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAllPostsAdmin } from "@/lib/db/blog";
import { FileText, Plus, Upload } from "lucide-react";
import { BlogRowActions } from "./BlogRowActions";
import { AdminPageHeader, btn, StatCard } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog — Admin" };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

const readMins = (body: string) =>
  Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

export default async function BlogAdmin() {
  await requireAdmin();
  const posts = await getAllPostsAdmin();
  const published = posts.filter((p) => p.status === "published").length;
  const drafts = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Blog Editorial"
        subtitle="Manage articles, guides and market insights for public readers."
        actions={
          <>
            <Link href="/admin/blog/import" className={btn.secondary}>
              <Upload className="h-4 w-4" />
              Import JSON
            </Link>
            <Link href="/admin/blog/new" className={btn.primary}>
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total posts" value={posts.length} />
        <StatCard label="Published" value={published} tone="good" />
        <StatCard label="Drafts" value={drafts} tone="warn" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <FileText className="h-8 w-8 text-slate-300" />
            <p className="font-medium text-slate-500">No posts yet</p>
            <Link href="/admin/blog/new" className="text-sm font-semibold text-slate-900 underline underline-offset-2">
              Create the first post →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Post</th>
                <th className="hidden px-4 py-3 sm:table-cell">Author</th>
                <th className="hidden px-4 py-3 md:table-cell">Status</th>
                <th className="hidden px-4 py-3 lg:table-cell">Published</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50">
                  {/* Post title + meta */}
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="hidden shrink-0 sm:block">
                        {p.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.cover}
                            alt=""
                            className="h-12 w-16 rounded-md border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-xl">
                            📰
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 leading-snug line-clamp-1">
                          {p.title}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono">/blog/{p.slug}</span>
                          {p.tags[0] && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600">
                              {p.tags[0]}
                            </span>
                          )}
                          <span>{readMins(p.body)} min read</span>
                        </div>
                        {/* Mobile-only status badge */}
                        <div className="mt-1 md:hidden">
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Author */}
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="font-medium text-slate-700">{p.author}</div>
                    {p.authorRole && (
                      <div className="text-xs text-slate-400">{p.authorRole}</div>
                    )}
                  </td>
                  {/* Status */}
                  <td className="hidden px-4 py-3 md:table-cell">
                    <StatusBadge status={p.status} />
                  </td>
                  {/* Date */}
                  <td className="hidden px-4 py-3 lg:table-cell text-xs text-slate-500">
                    {fmt(p.publishedAt)}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <BlogRowActions
                      id={p.id}
                      slug={p.slug}
                      title={p.title}
                      status={p.status as "draft" | "published"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
      Draft
    </span>
  );
}
