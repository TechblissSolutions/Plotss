import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";
import { dashboardPath, getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in", description: "Sign in to PLOTSS to unlock owner contacts, save listings and manage your land.", robots: { index: false, follow: true } };
export const dynamic = "force-dynamic";

export default async function Page() {
  const s = await getSession();
  if (s) redirect(s.isAdmin ? "/admin" : dashboardPath(s.role));
  return (
    <main className="px-4 py-10 sm:py-16">
      <AuthModal inline="login" />
    </main>
  );
}
