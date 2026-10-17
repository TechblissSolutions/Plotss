export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 sm:p-8">
      {/* Page header skeleton */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-5 w-1 animate-pulse rounded-full bg-slate-200" />
          <div className="h-7 w-56 animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="ml-4 h-4 w-80 animate-pulse rounded bg-slate-100" />
      </div>

      {/* Bento stat grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Hero cell — colspan 2 */}
        <div
          className="col-span-2 rounded-2xl bg-[#f0f4f8] p-7"
          style={{ boxShadow: "6px 6px 12px #d1d9e6, -4px -4px 10px #ffffff" }}
        >
          <div className="mb-4 h-1.5 w-8 animate-pulse rounded-full bg-slate-200" />
          <div className="h-11 w-20 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-3 h-3 w-28 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100" />
        </div>

        {/* Smaller stats */}
        {[1, 2].map((i) => (
          <div
            key={i}
            className="col-span-1 rounded-2xl bg-[#f0f4f8] p-5"
            style={{ boxShadow: "6px 6px 12px #d1d9e6, -4px -4px 10px #ffffff" }}
          >
            <div className="mb-4 h-1.5 w-8 animate-pulse rounded-full bg-slate-200" />
            <div className="h-8 w-14 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-3 h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Card skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
        </div>
        <div className="space-y-3 p-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-4 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Two-col grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="space-y-3.5 p-5">
              {[1, 2, 3, 4].map((j) => (
                <div key={j}>
                  <div className="mb-1.5 flex justify-between">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-8 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="h-1.5 w-full animate-pulse rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
