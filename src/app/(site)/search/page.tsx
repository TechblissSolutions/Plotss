import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { SearchRoute } from "@/ui/routes";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  // Result pages for arbitrary queries are thin/duplicate content: keep them out of the index.
  return buildMetadata({ path: "/search", title: "Search industrial, commercial & residential land", noindex: Boolean(q) });
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  return <SearchRoute q={q} />;
}
