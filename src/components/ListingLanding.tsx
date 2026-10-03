import Link from "next/link";
import { ListingGrid } from "@/components/ListingGrid";
import type { Faq } from "@/lib/seo";
import type { Listing } from "@/ui/types";

/** Server-rendered SEO landing template shared by /city/[slug] and /category/[slug]. Copy + FAQs come from the admin SEO manager. */
export function ListingLanding({
  title, intro, listings, related, faq = [], crumbs = [], eyebrow, searchHref = "/search", orgPhone,
}: {
  title: string; intro: string; listings: Listing[]; related: { href: string; label: string }[]; faq?: Faq[];
  /** Breadcrumb trail before Home (e.g. [{ href: "/city/ghaziabad", label: "Ghaziabad" }]). */
  crumbs?: { href: string; label: string }[];
  /** Small uppercase tag above the H1, e.g. "Industrial Land · Ghaziabad". */
  eyebrow?: string;
  searchHref?: string;
  /** From /admin/seo's global settings — never hardcode a phone number here. */
  orgPhone?: string;
}) {
  const microMarkets = [...new Set(listings.map((l) => l.microMarket).filter(Boolean))].slice(0, 10);
  const verifiedCount = listings.filter((l) => l.verified || l.aiScreened).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone">
        <Link href="/" className="hover:text-clay">Home</Link>
        {crumbs.map((c) => <span key={c.href}> / <Link href={c.href} className="hover:text-clay">{c.label}</Link></span>)}
      </nav>

      {eyebrow && <div className="mt-4 inline-flex items-center rounded-full bg-sand px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-clay font-tabular">{eyebrow}</div>}
      <h1 className="font-serif-headline mt-3 text-4xl font-bold md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-3xl whitespace-pre-line text-stone">{intro}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={searchHref} className="paint-clay rounded-sm px-5 py-2.5 text-sm font-bold text-ivory">Browse {listings.length} {listings.length === 1 ? "Listing" : "Listings"}</Link>
        {orgPhone && <a href={`tel:${orgPhone}`} className="rounded-sm border border-line px-5 py-2.5 text-sm font-semibold text-graphite hover:border-graphite">Talk to an advisor</a>}
      </div>

      <div className="mt-6 flex flex-wrap gap-6 rounded-md border border-line bg-white p-4">
        <div><div className="text-2xl font-extrabold text-graphite font-tabular">{listings.length}</div><div className="text-xs text-stone uppercase tracking-wide">Live listings</div></div>
        <div><div className="text-2xl font-extrabold text-graphite font-tabular">{verifiedCount}</div><div className="text-xs text-stone uppercase tracking-wide">AI-screened or verified</div></div>
      </div>

      {microMarkets.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-wide text-stone">Popular areas</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {microMarkets.map((m) => (
              <Link key={m} href={`/search?q=${encodeURIComponent(m)}`} className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-graphite hover:border-clay">{m}</Link>
            ))}
          </div>
        </div>
      )}

      <ListingGrid listings={listings} />

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

      <div className="mt-10 rounded-md border border-line bg-white p-8 text-center">
        <h2 className="font-serif-headline text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-stone">Our team responds within 2 business hours.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {orgPhone && <a href={`tel:${orgPhone}`} className="paint-graphite rounded-sm px-5 py-2.5 text-sm font-bold text-ivory">{orgPhone}</a>}
          <Link href={searchHref} className="text-sm font-semibold text-clay underline">Browse listings</Link>
        </div>
      </div>
    </main>
  );
}
