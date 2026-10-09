import { brokerData } from "@/lib/db/dashboards";
import { redirect } from "next/navigation";
import { getFeatures } from "@/lib/features";
import { requireCapability } from "@/lib/session";
import { BrokerDashboard } from "@/ui/dashboards/Dashboards";
import { Shell } from "@/ui/dashboards/Shell";

export const metadata = { title: "Broker dashboard" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await requireCapability("is_broker_staff");
  if (!(await getFeatures()).brokers) redirect("/dashboard/seller");
  const d = await brokerData(s);
  return <Shell title="Broker console" sub="Listings, lead pipeline and your public profile." session={s}><BrokerDashboard name={s.name} listings={d.listings} leads={d.leads} profile={d.profile} canInviteStaff={Boolean(s.brokerId)} /></Shell>;
}
