"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, BookOpen, Briefcase, Bell, ClipboardCheck, CornerUpRight, ExternalLink, FileText, LayoutDashboard, Palette, Search, Settings, Users, Activity, Eye,
} from "lucide-react";

const GROUPS = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  {
    title: "Operations",
    items: [
      { href: "/admin/listings", label: "Approval queue", icon: ClipboardCheck },
      { href: "/admin/clients", label: "Clients", icon: Briefcase },
      { href: "/admin/users", label: "Users & brokers", icon: Users },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/admin/journey", label: "User journey", icon: Activity },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/content", label: "Content", icon: FileText },
      { href: "/admin/seo", label: "SEO", icon: Search },
      { href: "/admin/blog", label: "Blog", icon: BookOpen },
      { href: "/admin/redirects", label: "Redirects", icon: CornerUpRight },
      { href: "/admin/theme", label: "Theme & design", icon: Palette },
    ],
  },
  { title: "System", items: [{ href: "/admin/settings", label: "Launch settings", icon: Settings }] },
];

const PREVIEW = [
  { href: "/dashboard/buyer", label: "Buyer dashboard" },
  { href: "/dashboard/seller", label: "Seller dashboard" },
  { href: "/dashboard/broker", label: "Broker dashboard" },
];

export const NAV_GROUPS = GROUPS;

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <nav aria-label="Admin sections" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{g.title}</div>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active(href) ? "page" : undefined}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active(href) ? "bg-white/10 font-medium text-white before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-emerald-400" : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon aria-hidden className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Preview as user</div>
        <ul className="space-y-0.5">
          {PREVIEW.map((p) => (
            <li key={p.href}>
              <Link href={p.href} target="_blank" rel="noopener" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                <Eye aria-hidden className="h-4 w-4 shrink-0" />
                {p.label}
                <span className="sr-only">(opens in a new tab)</span>
                <ExternalLink aria-hidden className="ml-auto h-3 w-3 opacity-60" />
              </Link>
            </li>
          ))}
        </ul>
        <p className="px-3 pt-2 text-[11px] leading-snug text-slate-400">Opens each dashboard with your admin account, so it shows empty states. To test with real data, sign in with another account and give it that role under Users.</p>
      </div>
    </nav>
  );
}
