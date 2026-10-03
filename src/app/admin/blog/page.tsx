import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getAllPostsAdmin } from "@/lib/db/blog";
import { deleteBlog } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog" };

export default async function BlogAdmin() {
  await requireAdmin();
  const posts = await getAllPostsAdmin();
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Blog posts ({posts.length})</h1>
        <Link href="/admin/blog/new" className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white">+ New post</Link>
      </div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {posts.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <Link href={`/admin/blog/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
              <div className="text-xs text-slate-500">/blog/{p.slug} · <span className={p.status === "published" ? "text-green-700" : ""}>{p.status}</span></div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              {p.status === "published" && <Link href={`/blog/${p.slug}`} target="_blank" className="text-blue-700">View ↗</Link>}
              <form action={deleteBlog}><input type="hidden" name="id" value={p.id} /><button className="text-red-700">Delete</button></form>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="p-6 text-center text-slate-500">No posts yet.</p>}
      </div>
    </main>
  );
}
