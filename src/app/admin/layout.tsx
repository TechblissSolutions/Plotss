import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { requireAdmin } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { AdminNav } from "./AdminNav";
import { CurrentSection, MobileNav } from "./MobileNav";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// The super admin panel: its own app (sidebar + top bar), always opened in a separate tab.
// Colours are fixed (not themed) so a bad theme can never make it unusable.
// NOTE: layouts are not re-run on every client navigation, so every admin page and action also calls requireAdmin().
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const session = await getSession();
  const name = session?.name || "Admin";
  return (
    <div className="admin-root min-h-screen bg-slate-50 text-slate-900" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
      <style>{`
        .admin-root :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible { outline: 3px solid #2563eb !important; outline-offset: 2px !important; }
        .admin-root :where(a, button, summary) { cursor: pointer; }
        .admin-root :where(h1, h2, h3, h4, h5) { font-family: inherit; letter-spacing: normal; }
        .admin-root button:disabled { cursor: not-allowed; }
        @media (prefers-reduced-motion: reduce) { .admin-root * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
      `}</style>
      <a href="#admin-main" className="sr-only rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">Skip to main content</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-900 lg:flex">
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white text-sm font-bold text-slate-900">P</span>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">PLOTSS</div>
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Super admin</div>
          </div>
        </div>
        <AdminNav />
        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-sm font-semibold text-white">{name[0].toUpperCase()}</span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium text-white">{name}</div>
              <div className="text-[11px] text-slate-400">Super admin</div>
            </div>
          </div>
          <div className="rounded-lg border border-white/15 px-3 py-2 text-center text-sm text-slate-200 hover:bg-white/5 [&_button]:w-full [&_button]:text-slate-200"><SignOutButton /></div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header role="banner" className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <MobileNav signOut={<SignOutButton />} />
            <CurrentSection />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
              View site <span className="sr-only">(opens in a new tab)</span><ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </Link>
                      </div>
        </header>
        <div id="admin-main" tabIndex={-1} className="p-4 outline-none sm:p-8">{children}</div>
      </div>
    </div>
  );
}
