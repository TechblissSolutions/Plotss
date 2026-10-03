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

      <label className={lab}>Key takeaways (one per line — a short plain-language summary readers and AI answer engines can scan without reading the whole article)
        <textarea name="key_takeaways" rows={4} defaultValue={post?.keyTakeaways.join("\n")} className={inp} placeholder={"e.g. Khasra/Khatauni records must be checked before any payment\nMutation (dakhil-kharij) can take 4-8 weeks in Ghaziabad"} />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className={lab}>SEO title<input name="seo_title" defaultValue={post?.seoTitle ?? ""} className={inp} /></label>
        <label className={lab}>Author (byline name)<input name="author" defaultValue={post?.author} className={inp} /></label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={lab}>Author role (E-E-A-T — a real credential/role reads better than &ldquo;Editorial&rdquo;)<input name="author_role" defaultValue={post?.authorRole ?? ""} className={inp} placeholder="e.g. Land Advisory Lead, 8 years in NCR land records" /></label>
        <label className={lab}>Author bio (1-2 lines)<input name="author_bio" defaultValue={post?.authorBio ?? ""} className={inp} /></label>
      </div>
      <label className={lab}>SEO description<textarea name="seo_description" rows={2} defaultValue={post?.seoDescription ?? ""} className={inp} /></label>

      <label className={lab}>FAQ — one per line, question and answer separated by <code>||</code> (powers the on-page FAQ accordion and FAQPage schema for AI answer engines)
        <textarea name="faq" rows={4} defaultValue={post?.faq.map((f) => `${f.q}||${f.a}`).join("\n")} className={inp + " font-mono"} placeholder="How long does mutation take in Ghaziabad?||Typically 4-8 weeks after the sale deed is registered." />
      </label>
      <label className={lab}>Status
        <select name="status" defaultValue={post?.status ?? "draft"} className={inp}><option value="draft">Draft</option><option value="published">Published</option></select>
      </label>
      <button className="rounded-lg bg-slate-900 px-5 py-2 text-sm text-white">Save post</button>
    </form>
  );
}
