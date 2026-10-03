import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadEvents } from "@/lib/analytics/load";
import { buildReport, type FunnelStep } from "@/lib/analytics/report";
import { getFeatures } from "@/lib/features";

export const dynamic = "force-dynamic";
export const metadata = { title: "User journey" };

const RANGES = [1, 7, 30, 90];

const card = "rounded-xl border border-slate-200 bg-white p-5";
const th = "p-2 text-left text-xs font-medium uppercase text-slate-500";

function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-2xl tabular-nums">{value}</div>
      {note && <div className="text-xs text-slate-500">{note}</div>}
    </div>
  );
}

function Funnel({ title, steps, help }: { title: string; steps: FunnelStep[]; help: string }) {
  const max = Math.max(1, steps[0]?.sessions ?? 1);
  return (
    <section className={card}>
      <h2 className="font-medium">{title}</h2>
      <p className="mb-3 text-xs text-slate-500">{help}</p>
      <div className="space-y-2">
        {steps.map((s) => (
          <div key={s.key} className="text-sm">
            <div className="flex justify-between"><span>{s.label}</span><span className="tabular-nums">{s.sessions}{s.ofPrevious !== null && <span className="text-slate-500"> · {s.ofPrevious}% of previous</span>}</span></div>
            <div className="mt-1 h-2 rounded bg-slate-100"><div className="h-full rounded bg-slate-800" style={{ width: `${(s.sessions / max) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function JourneyPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  await requireAdmin();
  const days = RANGES.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 7;
  const [loaded, features] = await Promise.all([loadEvents(days), getFeatures()]);

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">User journey</h1>
        <p className="text-xs text-slate-500">Where visitors go, what they click, and where they leave. First-party data stored in your own database.</p>
      </div>
      <div className="flex gap-1 text-sm">
        {RANGES.map((r) => <Link key={r} href={`/admin/journey?days=${r}`} className={`rounded px-3 py-1 ${r === days ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>{r === 1 ? "24h" : `${r}d`}</Link>)}
      </div>
    </div>
  );

  if (!loaded) {
    return <main className="mx-auto max-w-6xl space-y-4 p-6">{header}<p className={card + " text-slate-600"}>No analytics table yet. Run migration <code>0003_launch_cities_and_analytics.sql</code> in Supabase, then visit the site with tracking accepted.</p></main>;
  }
  const r = buildReport(loaded.events);
  const empty = loaded.events.length === 0;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      {header}
      {!features.tracking && <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Tracking is switched off in Settings; new visits are not being recorded.</p>}
      {loaded.truncated && <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Showing the most recent 40,000 events only. Use a shorter range.</p>}
      {empty && <p className={card + " text-slate-600"}>No events in this period yet. Visitors appear here after they accept the analytics banner (if enabled).</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <Stat label="Visitors" value={r.overview.visitors} />
        <Stat label="Sessions" value={r.overview.sessions} />
        <Stat label="Page views" value={r.overview.pageViews} />
        <Stat label="Pages / session" value={r.overview.pagesPerSession} />
        <Stat label="Bounce rate" value={`${r.overview.bounceRate}%`} note="left after one page, no action" />
        <Stat label="Returning" value={r.overview.returningVisitors} note="visitors with 2+ sessions" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Funnel title="Buyer funnel" steps={r.buyerFunnel} help="Sessions that reached each step, in order. Big drops show where buyers leave." />
        <Funnel title="Seller funnel" steps={r.sellerFunnel} help="From opening the seller form to a submitted listing." />
      </div>

      <section className={card}>
        <h2 className="font-medium">Where sellers left the form <span className="text-sm font-normal text-slate-500">({r.abandoned} abandoned sessions)</span></h2>
        <p className="mb-3 text-xs text-slate-500">The last step reached and the last field touched before leaving. Field names only, never what was typed.</p>
        <table className="w-full text-sm"><thead><tr><th scope="col" className={th}>Last step reached</th><th scope="col" className={th}>Sessions</th><th scope="col" className={th}>Last field touched</th></tr></thead>
          <tbody>{r.formDrop.map((d) => <tr key={d.step} className="border-t border-slate-100"><td className="p-2 capitalize">{d.step}</td><td className="p-2 tabular-nums">{d.sessions}</td><td className="p-2 text-slate-600">{d.lastField || "—"}</td></tr>)}
            {r.formDrop.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-500">No abandoned forms.</td></tr>}</tbody></table>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-medium">Most clicked buttons and links</h2>
          <table className="w-full text-sm"><thead><tr><th scope="col" className={th}>Button / link</th><th scope="col" className={th}>On page</th><th scope="col" className={th}>Clicks</th><th scope="col" className={th}>People</th><th scope="col" className={th}>Click rate</th></tr></thead>
            <tbody>{r.ctas.slice(0, 15).map((c) => <tr key={c.path + c.label} className="border-t border-slate-100"><td className="p-2">{c.label}</td><td className="p-2 text-slate-500">{c.path}</td><td className="p-2 tabular-nums">{c.clicks}</td><td className="p-2 tabular-nums">{c.visitors}</td><td className="p-2 tabular-nums">{c.rate}%</td></tr>)}
              {r.ctas.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">No clicks yet.</td></tr>}</tbody></table>
          <p className="mt-2 text-xs text-slate-500">Click rate = clicks ÷ views of that page (can exceed 100% if people click more than once).</p>
        </section>

        <section className={card}>
          <h2 className="mb-3 font-medium">Pages</h2>
          <table className="w-full text-sm"><thead><tr><th scope="col" className={th}>Page</th><th scope="col" className={th}>Views</th><th scope="col" className={th}>People</th><th scope="col" className={th}>Avg time</th><th scope="col" className={th}>Avg scroll</th></tr></thead>
            <tbody>{r.pages.map((p) => <tr key={p.key} className="border-t border-slate-100"><td className="max-w-[16rem] truncate p-2">{p.key}</td><td className="p-2 tabular-nums">{p.a}</td><td className="p-2 tabular-nums">{p.b}</td><td className="p-2 tabular-nums">{p.c}s</td><td className="p-2 tabular-nums">{p.d}%</td></tr>)}
              {r.pages.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-500">No page views yet.</td></tr>}</tbody></table>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={card}><h2 className="mb-3 font-medium">Traffic sources</h2>
          {r.sources.map((s) => <div key={s.key} className="flex justify-between border-t border-slate-100 py-1.5 text-sm"><span>{s.key}</span><span className="tabular-nums">{s.a}</span></div>)}
          {r.sources.length === 0 && <p className="text-sm text-slate-500">No data.</p>}</section>
        <section className={card}><h2 className="mb-3 font-medium">Devices</h2>
          {r.devices.map((s) => <div key={s.key} className="flex justify-between border-t border-slate-100 py-1.5 text-sm capitalize"><span>{s.key}</span><span className="tabular-nums">{s.a}</span></div>)}
          {r.devices.length === 0 && <p className="text-sm text-slate-500">No data.</p>}</section>
        <section className={card}><h2 className="mb-3 font-medium">What people search for</h2>
          {r.searches.slice(0, 8).map((s) => <div key={s.query} className="flex justify-between border-t border-slate-100 py-1.5 text-sm"><span className="truncate pr-2">{s.query}</span><span className="tabular-nums">{s.count}{s.zero > 0 && <span className="text-red-700"> · {s.zero} empty</span>}</span></div>)}
          {r.searches.length === 0 && <p className="text-sm text-slate-500">No searches yet.</p>}</section>
      </div>

      {r.zeroResult.length > 0 && (
        <section className={card}><h2 className="mb-1 font-medium">Searches with no results (supply gaps)</h2>
          <p className="mb-2 text-xs text-slate-500">People wanted this but we had nothing. Good hints for which listings to add.</p>
          {r.zeroResult.map((s) => <div key={s.query} className="flex justify-between border-t border-slate-100 py-1.5 text-sm"><span>{s.query}</span><span className="tabular-nums">{s.zero}×</span></div>)}
        </section>
      )}

      <section className={card}>
        <h2 className="mb-1 font-medium">Recent visitor journeys</h2>
        <p className="mb-3 text-xs text-slate-500">Anonymous unless the person was signed in. Time is seconds since the visit started.</p>
        <div className="space-y-3">
          {r.recent.map((s) => (
            <details key={s.sid} className="rounded-xl border border-slate-100 p-3 text-sm">
              <summary className="cursor-pointer">
                <span className="tabular-nums text-slate-500">{new Date(s.start).toLocaleString("en-IN")}</span> · {s.device} · from {s.source}{s.signedIn && <span className="ml-2 rounded bg-green-100 px-1.5 text-xs text-green-800">signed in</span>} · {s.steps.length} steps
              </summary>
              <ol className="mt-2 space-y-1 text-xs">
                {s.steps.map((st, i) => <li key={i} className="flex gap-3"><span className="w-12 shrink-0 tabular-nums text-slate-500">+{st.t}s</span><span className="w-24 shrink-0 text-slate-600">{st.type}</span><span className="truncate">{st.what}</span></li>)}
              </ol>
            </details>
          ))}
          {r.recent.length === 0 && <p className="text-sm text-slate-500">No sessions yet.</p>}
        </div>
      </section>
    </main>
  );
}
