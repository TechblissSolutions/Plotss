import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { AboutPage } from "@/ui/pages/StaticPages";

export const generateMetadata = (): Promise<Metadata> =>
  buildMetadata({ path: "/about", title: "About PLOTSS", description: "Who we are, why we built PLOTSS and what we stand for." });

export default function Page() {
  return <AboutPage />;
}
