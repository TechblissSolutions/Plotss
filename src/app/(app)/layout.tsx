import type { Metadata } from "next";
import Link from "next/link";
import { NotificationBell } from "@/components/NotificationBell";
import { SignOutButton } from "@/components/SignOutButton";
import { getContent } from "@/lib/content/store";
import { getNotifications } from "@/lib/db/notifications";
import { getSession } from "@/lib/session";
import { ContentProvider } from "@/ui/content";

export const metadata: Metadata = { title: "My dashboard", robots: { index: false, follow: false } };

// Buyer / seller / broker dashboards live in the same tab as the marketplace, with their own simple top bar.
// TODO (post-launch): A unified /workspace route consolidating all dashboards is deferred to post-launch.
// (Only the super admin panel opens in a separate tab.)
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [session, content] = await Promise.all([getSession(), getContent()]);
  const notifications = session ? await getNotifications(session.id) : [];
  return (
    <ContentProvider value={content}>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-serif-headline text-xl font-bold text-graphite">PLOTSS</Link>
            <Link href="/search" className="hidden text-sm text-stone hover:text-graphite sm:inline">Browse listings</Link>
            <Link href="/post-listing" className="hidden text-sm text-stone hover:text-graphite sm:inline">Post a listing</Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {session?.isAdmin && <Link href="/admin" className="text-clay">← Admin panel</Link>}
            {session && <NotificationBell items={notifications} />}
            {session && (
              <span className="hidden items-center gap-2 sm:flex">
                <span className="grid h-8 w-8 place-items-center rounded-full paint-graphite text-xs font-bold text-ivory">{(session.name || "U")[0].toUpperCase()}</span>
                <span className="leading-tight">
                  <span className="block text-xs font-semibold text-graphite">{session.name}</span>
                  <span className="block text-[11px] uppercase tracking-wider text-stone">
                    {session.isAdmin ? "Admin" : session.isBrokerStaff ? "Broker Staff" : (session.canSell && session.canBuy) ? "Buyer & Seller" : session.canSell ? "Seller" : "Buyer"}
                  </span>
                </span>
              </span>
            )}
            <span className="rounded-sm border border-line px-3 py-1.5 text-xs font-semibold text-graphite hover:border-graphite [&_button]:text-graphite"><SignOutButton /></span>
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </ContentProvider>
  );
}
