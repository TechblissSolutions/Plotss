import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingLanding } from "@/components/ListingLanding";
import { getLiveListings } from "@/lib/db/listings";
import { breadcrumbLd, buildMetadata, faqLd, getSeoGlobal, getSeoRow, jsonLd } from "@/lib/seo";
import { getCities } from "@/lib/db/cities";
import { CATEGORY_LIST, listingsInCity } from "@/ui/data/taxonomy";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = (await getCities()).find((x) => x.slug === slug);
  if (!c) return {};
  return buildMetadata({
    path: `/city/${c.slug}`, title: `Industrial & commercial land in ${c.name}`,
    description: `Industrial, commercial and residential land for sale and lease in ${c.name}, ${c.state}. Browse listings and contact owners.`,
  });
}

export default async function CityPage({ params }: Props) {
  const { slug } = await params;
  const cityRows = await getCities();
  const city = cityRows.find((c) => c.slug === slug);
  if (!city) notFound();
  const [all, row, g] = await Promise.all([getLiveListings(), getSeoRow(`/city/${slug}`), getSeoGlobal()]);
  const listings = listingsInCity(all, city.name);
  const faq = row?.faq ?? [];
  const ld = [breadcrumbLd(g, [{ name: "Home", path: "/" }, { name: `Land in ${city.name}`, path: `/city/${slug}` }]), ...(faq.length ? [faqLd(faq)] : [])];
  return (
    <>
      {ld.map((o, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(o) }} />)}
      <ListingLanding
        title={row?.h1 || `Land in ${city.name}`}
        intro={row?.intro || `${listings.length} listing${listings.length === 1 ? "" : "s"} across industrial, commercial and residential land in ${city.name}, ${city.state}.`}
        listings={listings}
        faq={faq}
        related={[
          ...CATEGORY_LIST.map((c) => ({ href: `/category/${c.slug}`, label: `${c.name} land` })),
          ...cityRows.filter((c) => c.slug !== slug).slice(0, 4).map((c) => ({ href: `/city/${c.slug}`, label: c.name })),
        ]}
      />
    </>
  );
}
