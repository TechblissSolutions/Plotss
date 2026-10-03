import type { Post } from "@/lib/db/blog";
import { saveBlog } from "../actions";

const inp = "w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm";
const lab = "block text-xs font-medium text-slate-600";

export function PostForm({ post }: { post?: Post }) {
  return (
    <form action={saveBlog} className="mx-auto max-w-6xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{post ? "Edit post" : "New post"}</h1>
      <input type="hidden" name="id" defaultValue={post?.id ?? ""} />
      <label className={lab}>Title<input name="title" required defaultValue={post?.title} className={inp} /></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={lab}>URL slug (auto from title if empty)<input name="slug" defaultValue={post?.slug} className={inp} /></label>
        <label className={lab}>Tags (comma separated)<input name="tags" defaultValue={post?.tags.join(", ")} className={inp} /></label>
      </div>
      <label className={lab}>Excerpt (shown in listings + default meta description)<textarea name="excerpt" rows={2} defaultValue={post?.excerpt} className={inp} /></label>
      <label className={lab}>Body (Markdown: # headings, **bold**, - lists, [links](/url), ![image](url))
        <textarea name="body" rows={18} defaultValue={post?.body} className={inp + " font-mono"} />
      </label>
      <label className={lab}>Cover image URL<input name="cover_image" defaultValue={post?.cover ?? ""} className={inp} /></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={lab}>SEO title<input name="seo_title" defaultValue={post?.seoTitle ?? ""} className={inp} /></label>
        <label className={lab}>Author<input name="author" defaultValue={post?.author} className={inp} /></label>
      </div>
      <label className={lab}>SEO description<textarea name="seo_description" rows={2} defaultValue={post?.seoDescription ?? ""} className={inp} /></label>
      <label className={lab}>Status
        <select name="status" defaultValue={post?.status ?? "draft"} className={inp}><option value="draft">Draft</option><option value="published">Published</option></select>
      </label>
      <button className="rounded-lg bg-slate-900 px-5 py-2 text-sm text-white">Save post</button>
    </form>
  );
}
