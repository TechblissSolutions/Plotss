import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBrokers } from "@/lib/db/listings";
import { getFeatures } from "@/lib/features";
import { buildMetadata } from "@/lib/seo";
import { BrokerRoute } from "@/ui/routes";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = (await getBrokers()).find((x) => x.id === id);
  return b ? buildMetadata({ path: `/broker/${b.id}`, title: `${b.name} — verified land broker`, description: b.bio || `${b.name}, ${b.firmName}. Verified listings on PLOTSS.` }) : {};
}

export default async function BrokerPage({ params }: Props) {
  const { id } = await params;
  if (!(await getFeatures()).brokers || !(await getBrokers()).some((b) => b.id === id)) notFound();
  return <BrokerRoute id={id} />;
}
