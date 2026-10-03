import type { Metadata } from "next";
import { buildMetadata, getSeoGlobal, jsonLd, orgLd, websiteLd } from "@/lib/seo";
import { HomeRoute } from "@/ui/routes";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/", title: "Industrial & commercial land in Ghaziabad, Noida and New Delhi" });
}

export default async function Home() {
  const g = await getSeoGlobal();
  return (
    <>
      {[orgLd(g), websiteLd(g)].map((o, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(o) }} />
      ))}
      <HomeRoute />
    </>
  );
}
