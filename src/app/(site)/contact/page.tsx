import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { ContactPage } from "@/ui/pages/StaticPages";

export const generateMetadata = (): Promise<Metadata> =>
  buildMetadata({ path: "/contact", title: "Contact PLOTSS", description: "Email, phone and WhatsApp for questions about listings, posting land or partnerships." });

export default function Page() {
  return <ContactPage />;
}
