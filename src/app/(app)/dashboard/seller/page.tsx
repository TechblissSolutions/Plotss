import { sellerData } from "@/lib/db/dashboards";
import { requireRole } from "@/lib/session";
import { SellerDashboard } from "@/ui/dashboards/SellerDashboard";
import { Shell } from "@/ui/dashboards/Shell";

export const metadata = { title: "Seller dashboard" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await requireRole("seller");
  const d = await sellerData(s);
  return <Shell title="Seller dashboard" sub="See how your land is doing, and reply to buyers quickly."><SellerDashboard listings={d.listings} leads={d.leads} /></Shell>;
}
