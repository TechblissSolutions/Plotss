import { requireAdmin } from "@/lib/auth";
import { analytics } from "@/lib/db/admin";

export const dynamic = "force-dynamic";

function Bars({ title, data }: { title: string; data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-medium">{title}</h2>
      <div className="space-y-2">
        {data.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
        {data.map(([k, n]) => (
          <div key={k} className="flex items-center gap-3 text-sm">
            <span className="w-32 truncate capitalize text-slate-600">{k}</span>
            <div className="h-3 flex-1 rounded bg-slate-100"><div className="h-full rounded bg-slate-800" style={{ width: `${(n / max) * 100}%` }} /></div>
            <span className="w-10 text-right tabular-nums">{n}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const tally = (xs: string[]): [string, number][] =>
  Object.entries(xs.reduce<Record<string, number>>((a, x) => ((a[x] = (a[x] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);

export default async function Analytics() {
  await requireAdmin();
  const a = await analytics();
  if (!a) return <main className="p-6 text-slate-500">Analytics need the database (run migration 0002).</main>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = a.props as any[];
  const top = [...props].sort((x, y) => (y.views ?? 0) - (x.views ?? 0)).slice(0, 5).map((p): [string, number] => [p.title, p.views ?? 0]);
  const day = (iso: string) => iso.slice(0, 10);
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([
          ["Listings", props.length], ["Live", props.filter((p) => p.status === "live").length],
          ["Unlocks (30d)", a.enquiries.filter((e) => e.kind === "unlock").length], ["Enquiries (30d)", a.enquiries.filter((e) => e.kind === "enquiry").length],
        ] as [string, number][]).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs uppercase text-slate-500">{k}</div><div className="text-2xl tabular-nums">{v}</div></div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Bars title="Listings by city" data={tally(props.map((p) => p.city?.name ?? "—"))} />
        <Bars title="Listings by category" data={tally(props.map((p) => p.category?.name ?? "—"))} />
        <Bars title="Listings by status" data={tally(props.map((p) => p.status))} />
        <Bars title="Verification" data={tally(props.map((p) => (p.is_verified ? "verified" : "unverified")))} />
        <Bars title="Most viewed listings" data={top} />
        <Bars title="Users by role" data={tally(a.users.map((u) => u.role as string))} />
        <Bars title="Contact unlocks per day (30d)" data={tally(a.enquiries.filter((e) => e.kind === "unlock").map((e) => day(e.created_at as string))).sort((x, y) => x[0].localeCompare(y[0]))} />
      </div>
    </main>
  );
}
