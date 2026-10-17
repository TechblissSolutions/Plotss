"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[60svh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-serif-headline text-3xl font-bold text-graphite">Page failed to load</h1>
      <p className="max-w-sm text-sm text-stone">
        There was a problem loading this page. Please try again or return to the homepage.
      </p>
      {error.digest && (
        <p className="font-tabular text-xs text-stone opacity-60">Ref: {error.digest}</p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3">
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
    </main>
  );
}
