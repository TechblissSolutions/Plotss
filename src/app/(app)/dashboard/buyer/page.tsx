import { buyerData } from "@/lib/db/dashboards";
import { requireCapability } from "@/lib/session";
import { BuyerDashboard } from "@/ui/dashboards/BuyerDashboard";
import { Shell } from "@/ui/dashboards/Shell";

export const metadata = { title: "Buyer dashboard" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await requireCapability("can_buy");
  const d = await buyerData(s);
  return <Shell title="Buyer dashboard" sub="Tell us what you need, and keep track of the land you like." session={s}><BuyerDashboard d={d} /></Shell>;
}
