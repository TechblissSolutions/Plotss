import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedPosts, type Post } from "@/lib/db/blog";
import { buildMetadata } from "@/lib/seo";
import { T } from "@/ui/content";

const PER_PAGE = 9;
type Props = { searchParams: Promise<{ tag?: string; page?: string }> };

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/blog", title: "Land buying guides & market insights",
    description: "Due-diligence checklists, area price trends and legal guides for buying industrial, commercial and residential land in Ghaziabad, Noida and New Delhi.",
  });
}

const readMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

function Card({ p, big = false }: { p: Post; big?: boolean }) {
  return (
    <Link href={`/blog/${p.slug}`} className={`group flex overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-clay ${big ? "flex-col md:col-span-2 md:flex-row" : "flex-col"}`}>
      {p.cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.cover} alt="" loading={big ? "eager" : "lazy"} className={`w-full object-cover ${big ? "aspect-[16/9] md:aspect-auto md:w-1/2" : "aspect-[16/9]"}`} />
      ) : (
        <div className={`bg-sand grid place-items-center text-4xl ${big ? "aspect-[16/9] md:w-1/2" : "aspect-[16/9]"}`} aria-hidden>📰</div>
      )}
      <div className={`flex flex-1 flex-col p-5 ${big ? "md:p-8" : ""}`}>
        <div className="text-xs font-semibold uppercase tracking-wider text-clay">{p.tags[0] ?? "Insights"}</div>
        <h2 className={`font-serif-headline mt-2 font-bold leading-snug group-hover:text-clay ${big ? "text-2xl md:text-3xl" : "text-xl"}`}>{p.title}</h2>
        <p className={`mt-2 text-sm text-stone ${big ? "line-clamp-4" : "line-clamp-3"}`}>{p.excerpt}</p>
        <div className="mt-auto pt-4 text-xs text-stone">{[fmt(p.publishedAt), `${readMinutes(p.body)} min read`].filter(Boolean).join(" · ")}</div>
      </div>
    </Link>
  );
}

export default async function BlogIndex({ searchParams }: Props) {
  const { tag, page } = await searchParams;
  const all = await getPublishedPosts();
  const tags = [...new Set(all.flatMap((p) => p.tags))].sort();
  const list = tag ? all.filter((p) => p.tags.includes(tag)) : all;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(pages, Math.max(1, Number(page) || 1));
  const slice = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const href = (t?: string, pg?: number) => `/blog${t || (pg && pg > 1) ? "?" : ""}${[t ? `tag=${encodeURIComponent(t)}` : "", pg && pg > 1 ? `page=${pg}` : ""].filter(Boolean).join("&")}`;
  const feature = current === 1 && !tag ? slice[0] : undefined;
  const rest = feature ? slice.slice(1) : slice;

  return (
    <main>
      <section className="bg-sand border-b border-line">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-stone"><Link href="/" className="hover:text-clay">Home</Link> / <span className="text-graphite">Market Insights</span></nav>
          <h1 className="font-serif-headline text-4xl font-bold md:text-5xl"><T k="blog.index.title">PLOTSS Market Insights</T></h1>
          <p className="mt-3 max-w-2xl text-lg text-stone"><T k="blog.index.subtitle">Guides and market notes for land buyers and owners in Ghaziabad, Noida and New Delhi.</T></p>
          {tags.length > 0 && (
            <nav aria-label="Topics" className="mt-6 flex flex-wrap gap-2">
              <Link href="/blog" aria-current={!tag ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-semibold ${!tag ? "paint-graphite border-graphite text-ivory" : "border-line bg-white hover:border-graphite"}`}><T k="blog.index.all-tag">All</T></Link>
              {tags.map((t) => (
                <Link key={t} href={href(t)} aria-current={tag === t ? "page" : undefined} className={`rounded-full border px-4 py-2 text-sm font-semibold ${tag === t ? "paint-graphite border-graphite text-ivory" : "border-line bg-white hover:border-graphite"}`}>{t}</Link>
              ))}
            </nav>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {list.length === 0 ? (
          <p className="rounded-md border border-line p-10 text-center text-stone"><T k="blog.index.empty">No articles here yet.</T> <Link href="/blog" className="font-semibold text-clay"><T k="blog.index.empty-cta">See all articles</T></Link></p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feature && <Card p={feature} big />}
            {rest.map((p) => <Card key={p.id} p={p} />)}
          </div>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3 text-sm">
            {current > 1 && <Link href={href(tag, current - 1)} rel="prev" className="rounded-sm border border-line px-4 py-2 font-semibold hover:border-graphite"><T k="blog.index.pager-newer">← Newer</T></Link>}
            <span className="text-stone">Page {current} of {pages}</span>
            {current < pages && <Link href={href(tag, current + 1)} rel="next" className="rounded-sm border border-line px-4 py-2 font-semibold hover:border-graphite"><T k="blog.index.pager-older">Older →</T></Link>}
          </nav>
        )}

        <section className="paint-graphite mt-14 rounded-md p-8 text-ivory md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="font-serif-headline text-2xl font-bold" style={{ color: "var(--c-ivory)" }}><T k="blog.index.cta-title">Ready to look at real land?</T></h2>
            <p className="mt-1 text-sm opacity-80"><T k="blog.index.cta-subtitle">Browse checked listings in Ghaziabad, Noida and New Delhi, or list your own land for free.</T></p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3 md:mt-0">
            <Link href="/search" className="paint-clay rounded-sm px-5 py-3 text-sm font-bold text-ivory"><T k="blog.index.cta-browse">Browse listings</T></Link>
            <Link href="/post-listing" className="rounded-sm border border-ivory/40 px-5 py-3 text-sm font-bold text-ivory"><T k="blog.index.cta-post">Post a listing</T></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
