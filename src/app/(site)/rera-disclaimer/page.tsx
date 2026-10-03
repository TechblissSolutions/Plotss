import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/ui/pages/StaticPages";

export const generateMetadata = (): Promise<Metadata> =>
  buildMetadata({ path: "/rera-disclaimer", title: "RERA Disclaimer", description: "Important note about listing information and legal checks." });

export default function Page() {
  return <LegalPage doc="rera" />;
}
