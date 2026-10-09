import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";
import { dashboardPath, getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Create your free account", description: "Join PLOTSS free to buy or sell land in Ghaziabad, Noida and New Delhi.", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await getSession();
  if (s) redirect(s.isAdmin ? "/admin" : dashboardPath(s.role));
  return (
    <main className="px-4 py-10 sm:py-16">
      <AuthModal inline="register" />
    </main>
  );
}
