"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AdminNav, NAV_GROUPS } from "./AdminNav";

/** Name of the section being viewed, shown in the top bar. */
export function CurrentSection() {
  const path = usePathname();
  const items = NAV_GROUPS.flatMap((g) => g.items);
  const hit = items.filter((i) => (i.href === "/admin" ? path === "/admin" : path.startsWith(i.href))).sort((a, b) => b.href.length - a.href.length)[0];
  return <span className="text-sm font-semibold text-slate-800">{hit?.label ?? "Admin"}</span>;
}

/** Slide-in menu for phones and tablets (the sidebar is hidden below 1024px). */
export function MobileNav({ signOut }: { signOut: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const openBtn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) { setLastPath(path); setOpen(false); }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => panel.current?.querySelectorAll<HTMLElement>("a[href],button:not([disabled])") ?? [];
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab") return;
      const f = [...focusables()];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    const btn = openBtn.current;
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; btn?.focus(); };
  }, [open]);

  return (
    <>
      <button ref={openBtn} type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="admin-mobile-menu"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 lg:hidden">
        <Menu aria-hidden className="h-4 w-4" /> Menu
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} aria-hidden />
          <div ref={panel} id="admin-mobile-menu" role="dialog" aria-modal="true" aria-label="Admin menu" className="absolute inset-y-0 left-0 flex w-[min(20rem,85vw)] flex-col bg-slate-900 shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
              <span className="text-sm font-semibold text-white">PLOTSS admin</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-lg text-slate-200 hover:bg-white/10">
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>
            <AdminNav onNavigate={() => setOpen(false)} />
            <div className="border-t border-white/10 p-4 [&_button]:w-full [&_button]:rounded-lg [&_button]:border [&_button]:border-white/20 [&_button]:px-3 [&_button]:py-2.5 [&_button]:text-sm [&_button]:text-slate-100">{signOut}</div>
          </div>
        </div>
      )}
    </>
  );
}
