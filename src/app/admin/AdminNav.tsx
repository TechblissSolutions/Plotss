"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2, ShieldCheck, ClipboardCheck, Users, Flag,
  FileText, BookOpen, Search, CornerUpRight, Palette,
  BarChart3, Activity,
  Zap, Bell, HeartPulse,
  ScrollText, Settings, KeyRound,
  Eye, ExternalLink, ChevronDown,
} from "lucide-react";
import React, { useState } from "react";

type NavItem = { href: string; label: string; icon: React.ElementType; badge?: string };
type NavGroup = { id: string; title: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    id: "home",
    title: "Home",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    id: "marketplace",
    title: "Marketplace",
    items: [
      { href: "/admin/listings", label: "Inventory & Listings", icon: Building2 },
      { href: "/admin/verification", label: "Verification Center", icon: ClipboardCheck },
      { href: "/admin/reports", label: "Reports & Complaints", icon: Flag },
      { href: "/admin/clients", label: "Clients", icon: ShieldCheck },
      { href: "/admin/users", label: "People & Accounts", icon: Users },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    id: "website",
    title: "Website Studio",
    items: [
      { href: "/admin/content", label: "Page & Content", icon: FileText },
      { href: "/admin/blog", label: "Blog Editorial", icon: BookOpen },
      { href: "/admin/seo", label: "SEO & Metadata", icon: Search },
      { href: "/admin/redirects", label: "Redirect Manager", icon: CornerUpRight },
      { href: "/admin/theme", label: "Theme & Design", icon: Palette },
    ],
  },
  {
    id: "growth",
    title: "Growth & Intelligence",
    items: [
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/journey", label: "User Journeys", icon: Activity },
    ],
  },
  {
    id: "platform",
    title: "Platform Operations",
    items: [
      { href: "/admin/settings", label: "Feature Controls", icon: Zap },
      { href: "/admin/health", label: "System Health", icon: HeartPulse },
    ],
  },
  {
    id: "governance",
    title: "Governance",
    items: [
      { href: "/admin/audit", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/general", label: "General Settings", icon: Settings },
      { href: "/admin/account", label: "Account Security", icon: KeyRound },
    ],
  },
];

const PREVIEW: NavItem[] = [
  { href: "/dashboard/buyer", label: "Buyer dashboard", icon: Eye },
  { href: "/dashboard/seller", label: "Seller dashboard", icon: Eye },
  { href: "/dashboard/broker", label: "Broker dashboard", icon: Eye },
];

export const NAV_GROUPS = GROUPS;

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/admin" ? path === "/admin" : path.startsWith(href);

  /* Which groups are expanded — default all open */
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      {GROUPS.map((g) => {
        const open = !collapsed.has(g.id);
        const anyActive = g.items.some((i) => active(i.href));
        return (
          <div key={g.id}>
            <button
              type="button"
              onClick={() => toggle(g.id)}
              className="flex w-full items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-500 hover:text-slate-300 transition-colors"
              aria-expanded={open}
            >
              <span className={anyActive && !open ? "text-white" : ""}>{g.title}</span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
              />
            </button>

            {open && (
              <ul className="mt-0.5 mb-2 space-y-0.5">
                {g.items.map(({ href, label, icon: Icon, badge }) => {
                  const isActive = active(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors ${
                          isActive
                            ? "bg-white/[0.11] font-medium text-white"
                            : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                        }`}
                      >
                        <Icon
                          aria-hidden
                          className={`h-[15px] w-[15px] shrink-0 transition-colors ${
                            isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                          }`}
                        />
                        <span className="min-w-0 truncate">{label}</span>
                        {badge && (
                          <span className="ml-auto shrink-0 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}

      {/* Preview as user */}
      <div className="pt-2">
        <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.11em] text-slate-600">
          Preview as
        </div>
        <ul className="space-y-0.5">
          {PREVIEW.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                target="_blank"
                rel="noopener"
                className="group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] text-slate-500 transition-colors hover:bg-white/[0.05] hover:text-slate-300"
              >
                <Icon aria-hidden className="h-[15px] w-[15px] shrink-0 text-slate-600 group-hover:text-slate-400" />
                <span className="min-w-0 truncate">{label}</span>
                <ExternalLink aria-hidden className="ml-auto h-3 w-3 shrink-0 opacity-40" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
