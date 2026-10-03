import React from "react";

export function Shell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-serif-headline text-3xl font-bold">{title}</h1>
      <p className="mb-8 mt-1 text-sm text-stone">{sub}</p>
      {children}
    </main>
  );
}
