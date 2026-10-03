import Link from "next/link";
import type { Faq } from "@/lib/seo";
import type { Listing } from "@/ui/types";

/** Server-rendered SEO landing template shared by /city/[slug] and /category/[slug]. Copy + FAQs come from the admin SEO manager. */
export function ListingLanding({
  title, intro, listings, related, faq = [],
}: {
  title: string; intro: string; listings: Listing[]; related: { href: string; label: string }[]; faq?: Faq[];
}) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif-headline text-4xl font-bold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-3xl whitespace-pre-line text-stone">{intro}</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((l) => (
          <Link key={l.id} href={`/listing/${l.slug}`} className="group overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-clay">
            {l.realImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.realImageUrl} alt={l.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
            )}
            <div className="p-4">
              <div className="text-xs text-stone">{l.city} · {l.microMarket}</div>
              <h2 className="font-serif-headline mt-1 text-lg font-bold leading-snug">{l.title}</h2>
              <div className="font-tabular mt-3 flex items-baseline justify-between">
                <span className="text-xl font-bold">{l.priceDisplay}</span>
                <span className="text-sm text-stone">{l.areaDisplay.split("(")[0]}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {listings.length === 0 && (
        <p className="mt-10 rounded-md border border-line p-10 text-center text-stone">
          No live listings yet. <Link href="/search" className="text-clay">Search all land</Link>
        </p>
      )}
      {faq.length > 0 && (
        <section className="mt-16 max-w-3xl">
          <h2 className="font-serif-headline text-2xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 divide-y divide-line rounded-md border border-line bg-white">
            {faq.map((f) => (
              <details key={f.q} className="group p-4">
                <summary className="cursor-pointer font-semibold">{f.q}</summary>
                <p className="mt-2 text-stone">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      <nav className="mt-14 flex flex-wrap gap-3 text-sm" aria-label="Related">
        {related.map((r) => <Link key={r.href} href={r.href} className="rounded-full border border-line px-3 py-1">{r.label}</Link>)}
      </nav>
    </main>
  );
}
