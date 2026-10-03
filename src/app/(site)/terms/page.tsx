import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { LegalPage } from "@/ui/pages/StaticPages";

export const generateMetadata = (): Promise<Metadata> =>
  buildMetadata({ path: "/terms", title: "Terms of Service", description: "The terms for using PLOTSS as a buyer or seller." });

export default function Page() {
  return <LegalPage doc="terms" />;
}
