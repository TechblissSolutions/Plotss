export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* nav skeleton */}
      <div className="mb-6 flex gap-3">
        {[80, 110, 100, 70].map((w) => (
          <div key={w} className="h-4 animate-pulse rounded bg-line" style={{ width: w }} />
        ))}
      </div>
      {/* heading */}
      <div className="h-8 w-64 animate-pulse rounded bg-line" />
      <div className="mt-2 mb-8 h-4 w-80 animate-pulse rounded bg-line" />
      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-line bg-white p-5 space-y-3">
            <div className="h-3 w-20 animate-pulse rounded bg-line" />
            <div className="h-8 w-16 animate-pulse rounded bg-line" />
            <div className="h-3 w-28 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>
      {/* content rows */}
      <div className="mt-6 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-line/50" />
        ))}
      </div>
    </main>
  );
}
