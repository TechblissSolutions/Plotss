export default function Loading() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white/95 p-8 shadow-sm space-y-6 animate-pulse">
        <div className="h-7 w-48 rounded-lg bg-line" />
        <div className="h-4 w-40 rounded bg-line" />
        <div className="mt-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] rounded-xl border border-line bg-line/40" />
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <div className="h-4 w-24 rounded bg-line" />
        </div>
      </div>
    </main>
  );
}
