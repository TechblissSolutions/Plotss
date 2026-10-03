"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { markNotificationsRead } from "@/app/(app)/actions";
import type { NotificationRow } from "@/lib/db/notifications";

export function NotificationBell({ items }: { items: NotificationRow[] }) {
  const [open, setOpen] = useState(false);
  const [, start] = useTransition();
  const unread = items.filter((i) => !i.read).length;

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) start(() => { void markNotificationsRead(); });
  };

  return (
    <div className="relative">
      <button type="button" onClick={toggle} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} className="relative rounded-sm p-2 text-graphite hover:bg-sand">
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full paint-clay text-[10px] font-bold text-ivory">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-line bg-white shadow-md">
            <div className="border-b border-line px-4 py-2 text-xs font-semibold uppercase tracking-wide text-stone">Notifications</div>
            <div className="max-h-96 divide-y divide-line overflow-y-auto">
              {items.length === 0 && <p className="p-4 text-sm text-stone">No notifications yet.</p>}
              {items.map((n) => (
                <Link key={n.id} href={n.link ?? "#"} onClick={() => setOpen(false)} className={`block p-3 text-sm hover:bg-sand ${n.read ? "" : "bg-sand/60"}`}>
                  <div className="font-semibold text-graphite">{n.title}</div>
                  <div className="mt-0.5 text-xs text-stone">{n.body}</div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
