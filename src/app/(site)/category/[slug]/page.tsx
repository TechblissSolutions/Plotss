import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingLanding } from "@/components/ListingLanding";
import { getLiveListings } from "@/lib/db/listings";
import { breadcrumbLd, buildMetadata, faqLd, getSeoGlobal, getSeoRow, jsonLd } from "@/lib/seo";
import { getCities } from "@/lib/db/cities";
import { CATEGORY_LIST, listingsInCategory } from "@/ui/data/taxonomy";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = CATEGORY_LIST.find((x) => x.slug === slug);
  if (!c) return {};
  return buildMetadata({
    path: `/category/${c.slug}`, title: `${c.name} land for sale & lease in India`,
    description: `${c.blurb}. Browse listings with price, area and location.`,
  });
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = CATEGORY_LIST.find((c) => c.slug === slug);
  if (!cat) notFound();
  const [all, row, g, cityRows] = await Promise.all([getLiveListings(), getSeoRow(`/category/${slug}`), getSeoGlobal(), getCities()]);
  const faq = row?.faq ?? [];
  const ld = [breadcrumbLd(g, [{ name: "Home", path: "/" }, { name: `${cat.name} land`, path: `/category/${slug}` }]), ...(faq.length ? [faqLd(faq)] : [])];
  return (
    <>
      {ld.map((o, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(o) }} />)}
      <ListingLanding
        title={row?.h1 || `${cat.name} land`}
        intro={row?.intro || cat.blurb + "."}
        listings={listingsInCategory(all, cat.name)}
        faq={faq}
        related={cityRows.map((c) => ({ href: `/city/${c.slug}`, label: `Land in ${c.name}` }))}
      />
    </>
  );
}
