import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { ShaderBackground } from "@/components/ShaderBackground";
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
    <div className="admin-root min-h-screen bg-[#f8f9fb] text-slate-900" style={{ fontFamily: "'Inter var','Inter',-apple-system,'Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        .admin-root :where(a, button, input, select, textarea, summary, [tabindex]):focus-visible { outline: 2px solid #6366f1 !important; outline-offset: 2px !important; border-radius: 6px; }
        .admin-root :where(a, button, summary) { cursor: pointer; }
        .admin-root :where(h1, h2, h3, h4, h5) { font-family: inherit; }
        .admin-root button:disabled { cursor: not-allowed; }
        .admin-root * { -webkit-font-smoothing: antialiased; }
        @media (prefers-reduced-motion: reduce) { .admin-root * { transition: none !important; animation: none !important; scroll-behavior: auto !important; } }
        @media (hover: hover) and (pointer: fine) { .admin-nav-link:hover { background: rgba(255,255,255,0.07); } }
      `}</style>
      <a href="#admin-main" className="sr-only rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]">Skip to main content</a>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-[#0f1117] lg:flex">
        {/* Logo mark */}
        <div className="relative flex h-[60px] shrink-0 items-center gap-3 border-b border-white/[0.07] px-5 overflow-hidden">
          <ShaderBackground opacity={0.10} className="absolute inset-0 w-full h-full" />
          <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-[13px] font-bold text-slate-900">P</span>
          <div className="relative z-10 leading-tight">
            <div className="text-[13px] font-semibold tracking-tight text-white">PLOTSS</div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-slate-500">Super admin</div>
          </div>
        </div>
        <AdminNav />
        {/* User footer */}
        <div className="shrink-0 border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-semibold text-white">
              {name[0].toUpperCase()}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-medium text-white">{name}</div>
              <div className="text-[11px] text-slate-500">Super admin</div>
            </div>
          </div>
          <div className="[&_button]:w-full [&_button]:rounded-lg [&_button]:border [&_button]:border-white/10 [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-xs [&_button]:text-slate-400 [&_button:hover]:bg-white/5 [&_button:hover]:text-slate-200">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header role="banner" className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <MobileNav signOut={<SignOutButton />} />
            <CurrentSection />
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              View site
              <span className="sr-only">(opens in a new tab)</span>
              <ExternalLink aria-hidden className="h-3 w-3" />
            </Link>
          </div>
        </header>
        <div id="admin-main" tabIndex={-1} className="px-6 py-6 outline-none sm:px-8 sm:py-8 max-w-[1400px] mx-auto">{children}</div>
      </div>
    </div>
  );
}
