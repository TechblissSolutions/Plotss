"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-lg font-semibold text-red-900">Admin page error</h2>
      <p className="mt-2 text-sm text-red-700">
        This admin page failed to load. Check the server logs for details.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-red-500">Ref: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 active:scale-[0.98]"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone bg-white px-4 py-2 text-sm font-medium text-graphite shadow-sm transition-colors hover:bg-sand active:scale-[0.98]"
        >
          Back to admin
        </Link>
      </div>
    </div>
  );
}
