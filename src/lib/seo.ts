import "server-only";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createPublicClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type Faq = { q: string; a: string };
export type SeoRow = {
  path: string; title: string | null; description: string | null; h1: string | null; intro: string | null;
  og_image: string | null; canonical: string | null; noindex: boolean; faq: Faq[];
};
export type SeoGlobal = {
  siteName: string; titleTemplate: string; description: string; ogImage: string; twitter: string; siteUrl: string;
  orgName: string; orgLogo: string; orgPhone: string; orgEmail: string; sameAs: string[]; noindexAll: boolean;
};

export const DEFAULT_GLOBAL: SeoGlobal = {
  siteName: "PLOTSS",
  titleTemplate: "%s | PLOTSS",
  description: "Marketplace for industrial, commercial and residential land in Ghaziabad, Noida and New Delhi. Search in plain language and contact owners directly.",
  ogImage: "/listings/midc-industrial.jpg",
  twitter: "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  orgName: "PLOTSS", orgLogo: "", orgPhone: "", orgEmail: "", sameAs: [], noindexAll: false,
};

const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export const getSeoGlobal = unstable_cache(async (): Promise<SeoGlobal> => {
  if (!isSupabaseConfigured) return DEFAULT_GLOBAL;
  try {
    const { data } = await createPublicClient().from("site_settings").select("value").eq("key", "seo_global").maybeSingle();
    const v = (data?.value ?? {}) as Record<string, unknown>;
    const d = DEFAULT_GLOBAL;
    return {
      siteName: str(v.siteName, 60) || d.siteName,
      titleTemplate: str(v.titleTemplate, 80).includes("%s") ? str(v.titleTemplate, 80) : d.titleTemplate,
      description: str(v.description, 320) || d.description,
      ogImage: str(v.ogImage, 500) || d.ogImage,
      twitter: str(v.twitter, 60),
      siteUrl: (str(v.siteUrl, 200) || d.siteUrl).replace(/\/$/, ""),
      orgName: str(v.orgName, 100) || d.orgName, orgLogo: str(v.orgLogo, 500), orgPhone: str(v.orgPhone, 30), orgEmail: str(v.orgEmail, 100),
      sameAs: Array.isArray(v.sameAs) ? v.sameAs.filter((x): x is string => typeof x === "string" && /^https?:\/\//.test(x)).slice(0, 10) : [],
      noindexAll: Boolean(v.noindexAll),
    };
  } catch { return DEFAULT_GLOBAL; }
}, ["seo-global"], { tags: ["seo"], revalidate: 300 });

export const getSeoRow = unstable_cache(async (path: string): Promise<SeoRow | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await createPublicClient().from("seo_pages").select("*").eq("path", path).maybeSingle();
    return data ? ({ ...data, faq: Array.isArray(data.faq) ? data.faq : [] } as SeoRow) : null;
  } catch { return null; }
}, ["seo-row"], { tags: ["seo"], revalidate: 300 });

/** "{title} in {city}" style templates used for listing pages. */
export const fillTemplate = (tpl: string, vars: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

type Input = { path: string; title?: string; description?: string; image?: string; noindex?: boolean; type?: "website" | "article" };

/** Metadata for any page: admin override (seo_pages) > page default > global default. */
export async function buildMetadata(i: Input): Promise<Metadata> {
  const [g, row] = await Promise.all([getSeoGlobal(), getSeoRow(i.path)]);
  const title = row?.title || i.title || g.siteName;
  const description = row?.description || i.description || g.description;
  const image = row?.og_image || i.image || g.ogImage;
  const abs = (u: string) => (u.startsWith("http") ? u : `${g.siteUrl}${u.startsWith("/") ? "" : "/"}${u}`);
  const canonical = row?.canonical || `${g.siteUrl}${i.path === "/" ? "" : i.path}`;
  const noindex = g.noindexAll || row?.noindex || i.noindex || false;
  const full = title === g.siteName ? title : g.titleTemplate.replace("%s", title);
  return {
    metadataBase: new URL(g.siteUrl),
    title: { absolute: full },
    description,
    alternates: { canonical },
    robots: noindex ? { index: false, follow: !g.noindexAll } : { index: true, follow: true },
    openGraph: { title: full, description, url: canonical, siteName: g.siteName, type: i.type ?? "website", images: [{ url: abs(image) }], locale: "en_IN" },
    twitter: { card: "summary_large_image", title: full, description, images: [abs(image)], ...(g.twitter ? { site: g.twitter } : {}) },
  };
}

/** Safe JSON-LD serialiser (escapes < so a value can never close the script tag). */
export const jsonLd = (obj: unknown) => JSON.stringify(obj).replace(/</g, "\\u003c");

export const breadcrumbLd = (g: SeoGlobal, items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map((it, idx) => ({ "@type": "ListItem", position: idx + 1, name: it.name, item: `${g.siteUrl}${it.path}` })),
});

export const faqLd = (faq: Faq[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

export const orgLd = (g: SeoGlobal) => ({
  "@context": "https://schema.org", "@type": "Organization", name: g.orgName, url: g.siteUrl,
  ...(g.orgLogo ? { logo: g.orgLogo } : {}), ...(g.orgPhone ? { telephone: g.orgPhone } : {}), ...(g.orgEmail ? { email: g.orgEmail } : {}),
  ...(g.sameAs.length ? { sameAs: g.sameAs } : {}),
});

export const websiteLd = (g: SeoGlobal) => ({
  "@context": "https://schema.org", "@type": "WebSite", name: g.siteName, url: g.siteUrl,
  potentialAction: { "@type": "SearchAction", target: `${g.siteUrl}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
});
