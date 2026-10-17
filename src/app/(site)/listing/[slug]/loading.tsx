/** Skeleton shown by Next.js while the listing detail page loads (ISR/cache miss). */
export default function ListingLoading() {
  return (
    <div className="min-h-screen bg-ivory pb-24">
      {/* Breadcrumb strip */}
      <div className="border-b border-line bg-white py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <div className="h-3 w-24 animate-pulse rounded bg-line" />
          <div className="h-3 w-3 animate-pulse rounded bg-line" />
          <div className="h-3 w-48 animate-pulse rounded bg-line" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        {/* Title skeleton */}
        <div className="border-b border-line pb-6">
          <div className="flex gap-2 mb-3">
            <div className="h-5 w-28 animate-pulse rounded bg-line" />
            <div className="h-5 w-40 animate-pulse rounded bg-line" />
          </div>
          <div className="h-9 w-3/4 animate-pulse rounded bg-line" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded bg-line" />
        </div>

        {/* Hero image skeleton */}
        <div className="mt-6 h-[400px] sm:h-[500px] lg:h-[560px] animate-pulse rounded-md bg-line" />

        {/* Key facts strip */}
        <div className="mt-6 grid grid-cols-2 gap-6 rounded-sm border border-line bg-white p-5 sm:grid-cols-3 lg:grid-cols-5 lg:p-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 animate-pulse rounded bg-line" />
              <div className="h-7 w-24 animate-pulse rounded bg-line" />
              <div className="h-3 w-20 animate-pulse rounded bg-line" />
            </div>
          ))}
        </div>

        {/* 2-column body */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {[180, 240, 200].map((h) => (
              <div
                key={h}
                className="animate-pulse rounded-md border border-line bg-white p-6"
                style={{ height: h }}
              />
            ))}
          </div>
          {/* Right column */}
          <div className="space-y-6">
            {[160, 220, 280].map((h) => (
              <div
                key={h}
                className="animate-pulse rounded-md border border-line bg-white p-6"
                style={{ height: h }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
