import { requireAdmin } from "@/lib/auth";
import { getSeoGlobal, type SeoRow } from "@/lib/seo";
import { createServiceClient } from "@/lib/supabase/service";
import { getCities } from "@/lib/db/cities";
import { CATEGORY_LIST } from "@/ui/data/taxonomy";
import { deleteSeoRow, saveSeoGlobal, saveSeoRow } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "SEO" };

const inp = "w-full rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-sm";
const lab = "block text-xs font-medium text-slate-600";

function RowForm({ row, path }: { row?: SeoRow; path?: string }) {
  const faq = (row?.faq ?? []).map((f) => `${f.q}||${f.a}`).join("\n");
  return (
    <form action={saveSeoRow} className="space-y-3">
      <label className={lab}>Path
        <input name="path" required defaultValue={row?.path ?? path ?? ""} readOnly={Boolean(row)} placeholder="/city/pune  ·  /  ·  tpl:property" className={inp + (row ? " bg-slate-100" : "")} />
      </label>
      <label className={lab}>SEO title (≈ 50-60 chars)<input name="title" defaultValue={row?.title ?? ""} className={inp} /></label>
      <label className={lab}>Meta description (≈ 140-160 chars)<textarea name="description" rows={2} defaultValue={row?.description ?? ""} className={inp} /></label>
      <label className={lab}>Page heading (H1) — city / category pages<input name="h1" defaultValue={row?.h1 ?? ""} className={inp} /></label>
      <label className={lab}>Visible intro copy (city / category pages)<textarea name="intro" rows={4} defaultValue={row?.intro ?? ""} className={inp} /></label>
      <label className={lab}>FAQs — one per line as <code>Question||Answer</code> (adds FAQ schema)<textarea name="faq" rows={4} defaultValue={faq} className={inp} /></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className={lab}>Social image URL<input name="og_image" defaultValue={row?.og_image ?? ""} className={inp} /></label>
        <label className={lab}>Canonical URL (leave empty for default)<input name="canonical" defaultValue={row?.canonical ?? ""} className={inp} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="noindex" defaultChecked={row?.noindex} /> noindex (hide from search engines)</label>
      <button className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white">Save page SEO</button>
    </form>
  );
}

export default async function SeoPage() {
  await requireAdmin();
  const [g, cityRows] = await Promise.all([getSeoGlobal(), getCities()]);
  const { data } = await createServiceClient().from("seo_pages").select("*").order("path");
  const rows = (data ?? []).map((r) => ({ ...r, faq: Array.isArray(r.faq) ? r.faq : [] })) as SeoRow[];
  const suggested = ["/", "/search", "/blog", "tpl:property", ...cityRows.map((c) => `/city/${c.slug}`), ...CATEGORY_LIST.map((c) => `/category/${c.slug}`)]
    .filter((p) => !rows.some((r) => r.path === p));

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">SEO manager</h1>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-medium">Site-wide</h2>
        <form action={saveSeoGlobal} className="grid gap-3 md:grid-cols-2">
          <label className={lab}>Site name<input name="siteName" defaultValue={g.siteName} className={inp} /></label>
          <label className={lab}>Title template (must contain %s)<input name="titleTemplate" defaultValue={g.titleTemplate} className={inp} /></label>
          <label className={lab + " md:col-span-2"}>Default meta description<textarea name="description" rows={2} defaultValue={g.description} className={inp} /></label>
          <label className={lab}>Site URL (no trailing slash)<input name="siteUrl" defaultValue={g.siteUrl} className={inp} /></label>
          <label className={lab}>Default social image<input name="ogImage" defaultValue={g.ogImage} className={inp} /></label>
          <label className={lab}>Organisation name<input name="orgName" defaultValue={g.orgName} className={inp} /></label>
          <label className={lab}>Logo URL<input name="orgLogo" defaultValue={g.orgLogo} className={inp} /></label>
          <label className={lab}>Phone<input name="orgPhone" defaultValue={g.orgPhone} className={inp} /></label>
          <label className={lab}>Email<input name="orgEmail" defaultValue={g.orgEmail} className={inp} /></label>
          <label className={lab}>Twitter/X handle<input name="twitter" defaultValue={g.twitter} className={inp} /></label>
          <label className={lab + " md:col-span-2"}>Social profiles (one URL per line)<textarea name="sameAs" rows={3} defaultValue={g.sameAs.join("\n")} className={inp} /></label>
          <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="noindexAll" defaultChecked={g.noindexAll} /> Block search engines from the whole site (use on staging)</label>
          <div className="md:col-span-2"><button className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm text-white">Save site-wide SEO</button></div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-medium">Listing page template</h2>
        <p className="mb-3 text-xs text-slate-500">Path <code>tpl:property</code>. Tokens: {"{title} {city} {area} {price} {category} {zone}"}. Applies to every listing page unless it has its own row.</p>
        <RowForm row={rows.find((r) => r.path === "tpl:property")} path="tpl:property" />
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Pages with custom SEO ({rows.filter((r) => r.path !== "tpl:property").length})</h2>
        {rows.filter((r) => r.path !== "tpl:property").map((r) => (
          <details key={r.path} className="rounded-xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium">{r.path} <span className="font-normal text-slate-500">{r.title}</span>{r.noindex && " · noindex"}</summary>
            <div className="mt-4"><RowForm row={r} /></div>
            <form action={deleteSeoRow} className="mt-2"><input type="hidden" name="path" value={r.path} /><button className="text-xs text-red-700">Delete override</button></form>
          </details>
        ))}
        <details className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium">+ Add / edit a page</summary>
          <p className="my-2 text-xs text-slate-500">Quick picks: {suggested.slice(0, 14).join("  ·  ")}</p>
          <RowForm />
        </details>
      </section>
    </main>
  );
}
