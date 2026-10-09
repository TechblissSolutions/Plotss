export const revalidate = 3600; // ISR: revalidate every hour

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@/lib/db/listings";
import { breadcrumbLd, buildMetadata, fillTemplate, getSeoGlobal, getSeoRow, jsonLd } from "@/lib/seo";
import { DetailRoute } from "@/ui/routes";

type Props = { params: Promise<{ slug: string }> };

async function vars(slug: string) {
  const l = await getListingBySlug(slug);
  if (!l) return null;
  return { l, v: { title: l.title, city: l.city, area: l.areaDisplay.split("(")[0].trim(), price: l.priceDisplay, category: l.category, zone: l.zoneType } };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await vars(slug);
  if (!r) return {};
  const tpl = await getSeoRow("tpl:property");
  return buildMetadata({
    path: `/listing/${r.l.slug}`,
    title: fillTemplate(tpl?.title || "{title} — {city}", r.v),
    description: fillTemplate(tpl?.description || "{title}. {area} of {category} land in {city} at {price}. See the verification checklist, area insight and price check before you call.", r.v),
    image: r.l.realImageUrl,
  });
}

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const [r, g] = await Promise.all([vars(slug), getSeoGlobal()]);
  if (!r) notFound();
  const { l } = r;
  const abs = (u?: string) => (u ? (u.startsWith("http") ? u : `${g.siteUrl}${u}`) : undefined);
  const ld = [
    {
      "@context": "https://schema.org", "@type": "RealEstateListing", name: l.title, description: l.aiDescription,
      datePosted: l.createdAt, url: `${g.siteUrl}/listing/${l.slug}`,
      image: [l.realImageUrl, ...(l.galleryImages ?? [])].map(abs).filter(Boolean),
      offers: { "@type": "Offer", price: l.price, priceCurrency: "INR", availability: l.status === "live" ? "https://schema.org/InStock" : "https://schema.org/SoldOut" },
      about: { "@type": "Place", name: l.microMarket || l.city, address: { "@type": "PostalAddress", addressLocality: l.city, addressRegion: l.state, addressCountry: "IN" } },
    },
    breadcrumbLd(g, [{ name: "Home", path: "/" }, { name: "Search", path: "/search" }, { name: l.title, path: `/listing/${l.slug}` }]),
  ];
  return (
    <>
      {ld.map((o, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(o) }} />)}
      <DetailRoute slug={slug} listing={l} />
    </>
  );
}
