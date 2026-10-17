"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root error]", error);
  }, [error]);

  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-serif-headline text-3xl font-bold text-graphite">Something went wrong</h1>
      <p className="max-w-sm text-sm text-stone">
        An unexpected error occurred. Please try again, or contact support if the problem persists.
      </p>
      {error.digest && (
        <p className="font-tabular text-xs text-stone opacity-60">Ref: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="hairline rounded-md px-5 py-2.5 text-sm font-semibold text-graphite transition-colors hover:bg-line"
      >
        Try again
      </button>
    </main>
  );
}
