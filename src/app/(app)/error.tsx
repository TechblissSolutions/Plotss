"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <h1 className="font-serif-headline text-2xl font-bold text-graphite">
          Could not load your dashboard
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-stone">
          There was a problem loading your data. This is usually temporary — try refreshing the page.
        </p>
        {error.digest && (
          <p className="mt-3 font-tabular text-xs text-stone opacity-60">Ref: {error.digest}</p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="paint-graphite rounded-md px-5 py-2.5 text-sm font-semibold text-ivory transition-opacity hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="hairline rounded-md px-5 py-2.5 text-sm font-semibold text-graphite transition-colors hover:bg-line"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
