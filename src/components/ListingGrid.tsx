"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Map as MapIcon, ShieldCheck } from "lucide-react";
import { mapsHref } from "@/lib/geo";
import { useApp } from "@/ui/AppProvider";
import type { Listing } from "@/ui/types";

type Sort = "match" | "newest" | "price_asc" | "price_desc";
const SORTS: { id: Sort; label: string }[] = [
  { id: "match", label: "Recommended" },
  { id: "newest", label: "Newest first" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
];

function sortListings(listings: Listing[], sort: Sort): Listing[] {
  const copy = [...listings];
  if (sort === "newest") return copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (sort === "price_asc") return copy.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") return copy.sort((a, b) => b.price - a.price);
  return copy;
}

/** Shared card + sort control for /city/[slug] and /category/[slug] — the same save/map affordances as search results. */
export function ListingGrid({ listings }: { listings: Listing[] }) {
  const { savedIds, toggleSave } = useApp();
  const router = useRouter();
  const [sort, setSort] = useState<Sort>("match");
  const sorted = sortListings(listings, sort);

  if (!listings.length) {
    return (
      <p className="mt-10 rounded-md border border-line p-10 text-center text-stone">
        No live listings yet. <Link href="/search" className="text-clay">Search all land</Link>
      </p>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone">{listings.length} {listings.length === 1 ? "listing" : "listings"}</p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort listings"
          className="rounded-sm border border-line bg-white px-3 py-1.5 text-sm text-graphite"
        >
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((l) => {
          const isSaved = savedIds.includes(l.id);
          const href = `/listing/${l.slug}`;
          return (
            <div
              key={l.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(href)}
              onKeyDown={(e) => { if (e.key === "Enter") router.push(href); }}
              className="group relative cursor-pointer overflow-hidden rounded-md border border-line bg-white transition-colors hover:border-clay"
            >
              <div className="relative">
                {l.realImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.realImageUrl} alt={l.title} loading="lazy" className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
                {(l.verified || l.aiScreened) && (
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-[3px] border border-ink-2 paint-moss px-2 py-0.5 text-[11px] font-semibold text-ivory font-tabular shadow-sm">
                    <ShieldCheck className="h-3 w-3 text-signal" />
                    {l.verified ? "DOCS VERIFIED" : "AI-SCREENED"}
                  </div>
                )}
                <div className="absolute right-2 top-2 z-10 flex gap-1.5">
                  <a
                    href={mapsHref(l)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`View ${l.title} on the map`}
                    title="View on map"
                    className="grid h-8 w-8 place-items-center rounded-full bg-white/95 text-graphite shadow-sm"
                  >
                    <MapIcon className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSave(l.id); }}
                    aria-label={isSaved ? `Remove ${l.title} from saved` : `Save ${l.title}`}
                    aria-pressed={isSaved}
                    title={isSaved ? "Saved" : "Save"}
                    className={`grid h-8 w-8 place-items-center rounded-full shadow-sm transition-colors ${isSaved ? "paint-clay text-ivory" : "bg-white/95 text-graphite"}`}
                  >
                    <Heart className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="text-xs text-stone">{l.city} · {l.microMarket}</div>
                <h2 className="font-serif-headline mt-1 text-lg font-bold leading-snug">
                  <Link href={href} onClick={(e) => e.stopPropagation()} className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {l.title}
                  </Link>
                </h2>
                <div className="font-tabular mt-3 flex items-baseline justify-between">
                  <span className="text-xl font-bold">{l.priceDisplay}</span>
                  <span className="text-sm text-stone">{l.areaDisplay.split("(")[0]}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
