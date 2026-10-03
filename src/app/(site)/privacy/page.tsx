import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/ui/pages/StaticPages";

export const generateMetadata = (): Promise<Metadata> =>
  buildMetadata({ path: "/privacy", title: "Privacy Policy", description: "What PLOTSS collects, why, and your choices." });

export default function Page() {
  return <LegalPage doc="privacy" />;
}
