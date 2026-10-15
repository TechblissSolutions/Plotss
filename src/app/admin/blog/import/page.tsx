import { requireAdmin } from "@/lib/auth";
import { ImportClient } from "./ImportClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Import Blog Posts — Admin" };

export default async function ImportPage() {
  await requireAdmin();
  return <ImportClient />;
}
