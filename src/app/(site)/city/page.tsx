import type { Metadata } from "next";
import Link from "next/link";
import { getCities } from "@/lib/db/cities";
import { cityCards, getLiveListings } from "@/lib/db/listings";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/city", title: "Browse all cities",
    description: "Industrial, commercial and residential land listings across every city PLOTSS covers.",
  });
}

function CityCard({ name, state, plotCount, slug, big }: { name: string; state: string; plotCount: number; slug: string; big?: boolean }) {
  return (
    <Link
      href={`/city/${slug}`}
      className={`group relative block overflow-hidden rounded-md border border-line bg-sand ${big ? "aspect-[4/3]" : "aspect-[16/11]"}`}
    >
      {/* No real city photography yet — a flat tone stands in until that's added (see docs/29-agent-progress-tracker.md). */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-3 to-graphite transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className={`font-serif-headline font-bold text-ivory ${big ? "text-2xl" : "text-lg"}`}>{name}</h3>
        <p className="text-xs text-ivory/80 mt-0.5">{plotCount} {plotCount === 1 ? "listing" : "listings"} · {state}</p>
      </div>
    </Link>
  );
}

export default async function CityIndexPage() {
  const [cityRows, listings] = await Promise.all([getCities(), getLiveListings()]);
  const cards = cityCards(listings, cityRows).map((c, i) => ({ ...c, slug: cityRows[i]?.slug ?? c.name.toLowerCase().replace(/\s+/g, "-") }));
  const [featured, rest] = [cards.slice(0, 3), cards.slice(3)];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="text-xs text-stone"><Link href="/" className="hover:text-clay">Home</Link> / <span className="text-graphite">Cities</span></nav>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-clay font-tabular">
        {cityRows.length}+ cities covered
      </div>
      <h1 className="font-serif-headline mt-3 text-4xl font-bold">Explore All Cities</h1>
      <p className="mt-2 max-w-2xl text-stone">Industrial, commercial and residential land — AI-matched across every city PLOTSS covers.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {featured.map((c) => <CityCard key={c.slug} name={c.name} state={c.state} plotCount={c.plotCount} slug={c.slug} big />)}
      </div>

      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {rest.map((c) => <CityCard key={c.slug} name={c.name} state={c.state} plotCount={c.plotCount} slug={c.slug} />)}
        </div>
      )}
    </main>
  );
}
