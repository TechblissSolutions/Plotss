import React from "react";
import Link from "next/link";
import type { Session } from "@/lib/types";

type ShellProps = {
  title: string;
  sub: string;
  children: React.ReactNode;
  session?: Session | null;
};

export function Shell({ title, sub, children, session }: ShellProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {session && (
        <nav className="mb-6 flex flex-wrap gap-3 text-sm">
          <Link href="/search" className="text-stone hover:text-primary transition-colors">Browse listings</Link>
          {session.canBuy && (
            <Link href="/dashboard/buyer" className="text-stone hover:text-primary transition-colors">Buyer dashboard</Link>
          )}
          {session.canSell && (
            <Link href="/dashboard/seller" className="text-stone hover:text-primary transition-colors">Seller dashboard</Link>
          )}
          {session.isBrokerStaff && (
            <Link href="/dashboard/broker" className="text-stone hover:text-primary transition-colors">Broker dashboard</Link>
          )}
          {session.isAdmin && (
            <Link href="/admin/listings" className="text-stone hover:text-primary transition-colors">Admin panel</Link>
          )}
          <Link href="/settings" className="text-stone hover:text-primary transition-colors">Settings</Link>
        </nav>
      )}
      <h1 className="font-serif-headline text-3xl font-bold">{title}</h1>
      <p className="mb-8 mt-1 text-sm text-stone">{sub}</p>
      {children}
    </main>
  );
}
