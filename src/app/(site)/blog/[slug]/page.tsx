import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPublishedPosts } from "@/lib/db/blog";
import { extractHeadings, Markdown } from "@/lib/markdown";
import { breadcrumbLd, buildMetadata, faqLd, getSeoGlobal, jsonLd } from "@/lib/seo";
import { T } from "@/ui/content";

type Props = { params: Promise<{ slug: string }> };
const readMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) return {};
  return buildMetadata({
    path: `/blog/${p.slug}`, title: p.seoTitle || p.title, description: p.seoDescription || p.excerpt,
    image: p.cover ?? undefined, type: "article",
  });
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const [p, g, all] = await Promise.all([getPost(slug), getSeoGlobal(), getPublishedPosts()]);
  if (!p) notFound();
  const url = `${g.siteUrl}/blog/${p.slug}`;
  const others = all.filter((x) => x.id !== p.id);
  const related = [...others.filter((x) => x.tags.some((t) => p.tags.includes(t))), ...others.filter((x) => !x.tags.some((t) => p.tags.includes(t)))].slice(0, 3);
  const headings = extractHeadings(p.body).filter((h) => h.level === 2);
  const share = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${p.title} ${url}`)}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(p.title)}&url=${encodeURIComponent(url)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  ];
  // E-E-A-T: a role/bio on file is treated as a real named author for schema purposes; otherwise the
  // honest default is the publishing organization, not a fabricated person.
  const authorNode = p.authorRole
    ? { "@type": "Person", name: p.author, jobTitle: p.authorRole, ...(p.authorBio ? { description: p.authorBio } : {}) }
    : { "@type": "Organization", name: p.author };
  const ld = [
    {
      "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.excerpt,
      datePublished: p.publishedAt, dateModified: p.updatedAt, author: authorNode,
      publisher: { "@type": "Organization", name: g.orgName }, mainEntityOfPage: url,
      ...(p.cover ? { image: p.cover } : {}),
    },
    breadcrumbLd(g, [{ name: "Home", path: "/" }, { name: "Market Insights", path: "/blog" }, { name: p.title, path: `/blog/${p.slug}` }]),
    ...(p.faq.length ? [faqLd(p.faq)] : []),
  ];
  return (
    <main>
      {ld.map((o, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(o) }} />)}
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-xs text-stone">
          <Link href="/" className="hover:text-clay">Home</Link> / <Link href="/blog" className="hover:text-clay">Market Insights</Link>
          {p.tags[0] && <> / <Link href={`/blog?tag=${encodeURIComponent(p.tags[0])}`} className="hover:text-clay">{p.tags[0]}</Link></>}
        </nav>
        {p.tags[0] && <div className="mt-5 text-xs font-semibold uppercase tracking-wider text-clay">{p.tags[0]}</div>}
        <h1 className="font-serif-headline mt-2 text-4xl font-bold leading-tight md:text-5xl">{p.title}</h1>
        {p.excerpt && <p className="mt-4 text-lg text-stone">{p.excerpt}</p>}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 text-sm text-stone">
          <span>{[p.author, fmt(p.publishedAt), `${readMinutes(p.body)} min read`].filter(Boolean).join(" · ")}</span>
          <span className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider"><T k="blog.post.share">Share</T></span>
            {share.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-sm border border-line px-2.5 py-1.5 text-xs font-semibold text-graphite hover:border-clay">{s.label}<span className="sr-only"> (opens in a new tab)</span></a>)}
          </span>
        </div>

        {/* Key takeaways: AEO/GEO — a concise, self-contained summary an answer engine (or a skimming
            reader) can quote directly, without needing the full article. */}
        {p.keyTakeaways.length > 0 && (
          <div className="mt-6 rounded-md border border-line bg-sand p-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-trust"><T k="blog.post.takeaways-title">Key takeaways</T></h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-graphite">
              {p.keyTakeaways.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        )}

        {headings.length >= 3 && (
          <nav aria-label="Table of contents" className="mt-6 rounded-md border border-line p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone"><T k="blog.post.toc-title">In this article</T></h2>
            <ol className="mt-2 space-y-1 text-sm">
              {headings.map((h, i) => <li key={h.id}><a href={`#${h.id}`} className="text-clay hover:underline">{i + 1}. {h.text}</a></li>)}
            </ol>
          </nav>
        )}
      </div>

      {p.cover && (
        <div className="mx-auto mt-8 max-w-4xl px-4 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.cover} alt="" className="w-full rounded-md" />
        </div>
      )}

      <article className="mx-auto mt-8 max-w-3xl px-4 sm:px-6"><Markdown source={p.body} /></article>

      {/* E-E-A-T: a visible trust signal beyond the byline name — who wrote this and why they'd know. */}
      {(p.authorRole || p.authorBio) && (
        <div className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
          <div className="flex items-start gap-4 rounded-md border border-line bg-white p-5">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full paint-graphite text-sm font-bold text-ivory font-tabular">
              {p.author.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-graphite">{p.author}{p.authorRole && <span className="text-stone"> · {p.authorRole}</span>}</div>
              {p.authorBio && <p className="mt-1 text-sm text-stone">{p.authorBio}</p>}
            </div>
          </div>
        </div>
      )}

      {p.faq.length > 0 && (
        <section aria-labelledby="faq-h" className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
          <h2 id="faq-h" className="font-serif-headline text-2xl font-bold"><T k="blog.post.faq-title">Frequently asked questions</T></h2>
          <div className="mt-4 divide-y divide-line rounded-md border border-line bg-white">
            {p.faq.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 text-stone">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
        <aside className="bg-sand rounded-md border border-line p-6 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="font-serif-headline text-xl font-bold"><T k="blog.post.aside-title">Looking for land in Ghaziabad, Noida or New Delhi?</T></h2>
            <p className="mt-1 text-sm text-stone"><T k="blog.post.aside-subtitle">Browse checked listings and contact owners directly.</T></p>
          </div>
          <Link href="/search" className="paint-clay mt-4 inline-block shrink-0 rounded-sm px-5 py-3 text-sm font-bold text-ivory md:mt-0"><T k="blog.post.aside-cta">Browse listings</T></Link>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-h" className="mx-auto mt-14 max-w-6xl px-4 pb-16 sm:px-6">
          <h2 id="related-h" className="font-serif-headline text-2xl font-bold"><T k="blog.post.related-title">Keep reading</T></h2>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`} className="group overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-clay">
                {r.cover && /* eslint-disable-next-line @next/next/no-img-element */ <img src={r.cover} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />}
                <div className="p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-clay">{r.tags[0] ?? "Insights"}</div>
                  <h3 className="font-serif-headline mt-1 text-lg font-bold leading-snug group-hover:text-clay">{r.title}</h3>
                  <div className="mt-2 text-xs text-stone">{readMinutes(r.body)} min read</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
