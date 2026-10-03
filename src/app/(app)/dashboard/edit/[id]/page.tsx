import { notFound } from "next/navigation";
import { isDbReady } from "@/lib/db/listings";
import { requireRole } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase/service";
import { EditListingForm } from "@/ui/dashboards/EditListingForm";
import { Shell } from "@/ui/dashboards/Shell";

export const metadata = { title: "Edit listing" };
export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await requireRole("seller", "broker");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !(await isDbReady())) notFound();
  const svc = createServiceClient();
  const { data: p } = await svc
    .from("properties").select("id,owner_id,broker_id,status,title,description,price,area_value,micro_market,lat,lng,details,city:cities(slug,name)").eq("id", id).maybeSingle();
  const allowed = p && (p.owner_id === s.id || (s.brokerId && p.broker_id === s.brokerId) || s.role === "admin");
  if (!p || !allowed || p.status === "sold") notFound();
  const { data: c } = await svc.from("listing_contacts").select("phone").eq("property_id", id).maybeSingle();
  const city = (Array.isArray(p.city) ? p.city[0] : p.city) as { slug: string; name: string } | null;
  const d = (p.details ?? {}) as { roadWidth?: string; powerSanction?: string };
  return (
    <Shell title="Edit listing" sub="Update the details buyers see. Saving sends the listing back for a quick review.">
      <EditListingForm
        initial={{
          id: p.id, title: p.title, status: p.status, cityName: city?.name ?? "", citySlug: city?.slug ?? "",
          description: p.description ?? "", priceCr: String(Number(p.price) / 1e7), area: String(p.area_value ?? ""),
          microMarket: p.micro_market ?? "", roadWidth: d.roadWidth ?? "", powerLoad: d.powerSanction ?? "",
          contactPhone: (c?.phone ?? "").replace(/^\+91/, ""), lat: p.lat != null ? Number(p.lat) : null, lng: p.lng != null ? Number(p.lng) : null,
        }}
      />
    </Shell>
  );
}
