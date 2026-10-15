export default function Loading() {
  return (
    <div className="p-6 space-y-4">
      {/* page title */}
      <div className="h-7 w-48 animate-pulse rounded bg-white/10" />
      <div className="h-4 w-72 animate-pulse rounded bg-white/10" />
      {/* stat row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-5 space-y-2">
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
            <div className="h-7 w-12 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
      {/* table rows */}
      <div className="mt-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  );
}
