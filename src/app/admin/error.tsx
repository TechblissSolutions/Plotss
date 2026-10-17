"use client";

import { useEffect } from "react";

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
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-all hover:bg-red-50 active:scale-[0.98]"
      >
        Try again
      </button>
    </div>
  );
}
