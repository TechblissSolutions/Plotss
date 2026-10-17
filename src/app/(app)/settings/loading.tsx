export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* nav skeleton */}
      <div className="mb-6 flex gap-3">
        {[100, 120, 110, 70].map((w) => (
          <div key={w} className="h-4 animate-pulse rounded bg-line" style={{ width: w }} />
        ))}
      </div>
      {/* heading */}
      <div className="h-8 w-40 animate-pulse rounded bg-line" />
      <div className="mt-2 mb-8 h-4 w-72 animate-pulse rounded bg-line" />
      {/* setting sections */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-line bg-white p-5 space-y-3">
            <div className="h-5 w-32 animate-pulse rounded bg-line" />
            <div className="h-4 w-full animate-pulse rounded bg-line/60" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-line/60" />
          </div>
        ))}
      </div>
    </main>
  );
}
