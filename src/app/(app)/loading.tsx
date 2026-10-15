export default function Loading() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-line border-t-clay" />
        <p className="text-sm text-stone">Loading…</p>
      </div>
    </main>
  );
}
