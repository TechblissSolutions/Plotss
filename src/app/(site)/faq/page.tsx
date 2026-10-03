import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { FaqPage } from "@/ui/pages/StaticPages";

export const generateMetadata = (): Promise<Metadata> =>
  buildMetadata({ path: "/faq", title: "FAQ", description: "Answers about posting land, unlocking owner contacts, AI screening and cities covered." });

export default function Page() {
  return <FaqPage />;
}
