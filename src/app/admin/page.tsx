import Link from "next/link";
import { aiProviderName } from "@/lib/ai/llm";
import { loadEvents } from "@/lib/analytics/load";
import { buildReport } from "@/lib/analytics/report";
import { requireAuthAdminName } from "@/lib/auth-admin";
import { getCities } from "@/lib/db/cities";
import { adminListings, analytics } from "@/lib/db/admin";
import { isDbReady } from "@/lib/db/listings";
import { formatINR } from "@/lib/format";
import { getFeatures } from "@/lib/features";
import { getSeoGlobal } from "@/lib/seo";
import { daysAgo } from "@/lib/time";
import { Badge, btn, Card, PageHeader, Stat } from "./ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

type Check = { ok: boolean; label: string; hint: string; href?: string };

export default async function AdminHome() {
  const name = await requireAuthAdminName();
  const ready = await isDbReady();
  const [features, cities, seo, pending, a, ev] = await Promise.all([
    getFeatures(), getCities(), getSeoGlobal(), adminListings("pending"), analytics(), loadEvents(7),
  ]);
  const report = ev ? buildReport(ev.events) : null;

  const props = (a?.props ?? []) as { status: string; details?: { demo?: boolean } }[];
  const live = props.filter((p) => p.status === "live").length;
  const week = daysAgo(7);
  const leads7 = (a?.enquiries ?? []).filter((e) => Date.parse(e.created_at as string) > week).length;
  const unlockRate = report && report.buyerFunnel[2].sessions ? report.buyerFunnel[5].sessions : 0;

  const checks: Check[] = [
    { ok: ready, label: "Database migrations applied", hint: "Run migrations 0002 and 0003 in Supabase." },
    { ok: ev !== null, label: "Journey tracking table ready", hint: "Run migration 0003.", href: "/admin/journey" },
    { ok: Boolean(aiProviderName()), label: `AI provider ${aiProviderName() ? `connected (${aiProviderName()})` : "not connected"}`, hint: "Add GROQ_API_KEY or XAI_API_KEY to .env. Search and descriptions still work without it.", href: "/admin/settings" },
    { ok: cities.length > 0, label: `${cities.length} active launch cit${cities.length === 1 ? "y" : "ies"}`, hint: "Activate cities in Launch settings.", href: "/admin/settings" },
    { ok: !seo.siteUrl.includes("localhost"), label: "Public site address set", hint: "Set the real domain under SEO → Site-wide before launch.", href: "/admin/seo" },
    { ok: live > 0, label: `${live} live listing${live === 1 ? "" : "s"}`, hint: "Approve listings in the queue.", href: "/admin/listings" },
    { ok: !props.some((p) => p.details?.demo), label: "No demo listings on the site", hint: "Demo listings are still live. Remove them before launch.", href: "/admin/listings" },
  ];

  return (
    <main className="mx-auto max-w-7xl">
      <PageHeader
        title={`Welcome, ${name}`}
        subtitle="What needs your attention today, how the site is doing this week, and whether everything is set up for launch."
        actions={<Link href="/admin/listings" className={btn.primary}>Open approval queue</Link>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Waiting for review" value={pending.length} tone={pending.length ? "warn" : "good"} note={pending.length ? "Listings to approve" : "Queue is clear"} />
        <Stat label="Live listings" value={live} />
        <Stat label="Visitors (7d)" value={report?.overview.visitors ?? "—"} note={report ? `${report.overview.pageViews} page views` : "No tracking yet"} />
        <Stat label="Leads (7d)" value={leads7} note="Unlocks + enquiries" />
        <Stat label="Unlocks (7d)" value={unlockRate || 0} />
        <Stat label="Bounce rate" value={report ? `${report.overview.bounceRate}%` : "—"} note="Left after one page" />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <Card title="Listings waiting for review" note="Oldest first. Open the queue to approve or reject." className="lg:col-span-2">
          {pending.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">Nothing is waiting. New listings appear here as soon as sellers submit them.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 6).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">{p.title}</div>
                    <div className="text-xs text-slate-500">{p.city} · {p.category} · {formatINR(p.price)} · by {p.owner}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {features.aiScreening && p.screen && <Badge tone={p.screen.risk >= 60 ? "red" : p.screen.risk >= 40 ? "amber" : "green"}>Risk {p.screen.risk}</Badge>}
                    <Link href="/admin/listings" className={btn.small}>Review</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Launch readiness" note="Green means done.">
          <ul className="space-y-2.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5 text-sm">
                <span className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white ${c.ok ? "bg-emerald-500" : "bg-amber-500"}`}>{c.ok ? "✓" : "!"}</span>
                <span>
                  <span className={c.ok ? "text-slate-700" : "font-medium text-slate-900"}>{c.label}</span>
                  {!c.ok && <span className="block text-xs text-slate-500">{c.hint}{c.href && <> <Link href={c.href} className="text-blue-600 underline">Open</Link></>}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <Card title="Where visitors drop off" note="Buyer journey, last 7 days">
          {report && report.buyerFunnel[0].sessions > 0 ? (
            <ul className="space-y-2">
              {report.buyerFunnel.map((s) => (
                <li key={s.key} className="text-sm">
                  <div className="flex justify-between"><span className="text-slate-600">{s.label}</span><span className="tabular-nums">{s.sessions}</span></div>
                  <div className="mt-1 h-1.5 rounded bg-slate-100"><div className="h-full rounded bg-slate-800" style={{ width: `${(s.sessions / Math.max(1, report.buyerFunnel[0].sessions)) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="py-4 text-sm text-slate-500">No visits recorded yet. Visitors appear after they accept the analytics banner.</p>}
          <Link href="/admin/journey" className="mt-3 inline-block text-sm text-blue-600 underline">Full user journey report</Link>
        </Card>

        <Card title="Quick actions">
          <div className="grid gap-2">
            <Link href="/admin/blog/new" className={btn.secondary}>Write a blog article</Link>
            <Link href="/admin/content" className={btn.secondary}>Edit homepage text</Link>
            <Link href="/admin/theme" className={btn.secondary}>Change colours and fonts</Link>
            <Link href="/admin/seo" className={btn.secondary}>Improve SEO</Link>
            <Link href="/admin/settings" className={btn.secondary}>Launch settings</Link>
          </div>
        </Card>

        <Card title="How the site is set up" note="Change these in Launch settings">
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span className="text-slate-600">Documents from sellers</span><Badge tone={features.collectDocuments ? "green" : "gray"}>{features.collectDocuments ? "On" : "Off"}</Badge></li>
            <li className="flex justify-between"><span className="text-slate-600">AI risk screen</span><Badge tone={features.aiScreening ? "green" : "gray"}>{features.aiScreening ? "On" : "Off"}</Badge></li>
            <li className="flex justify-between"><span className="text-slate-600">Staff verification (Verified badge)</span><Badge tone={features.humanReview ? "green" : "gray"}>{features.humanReview ? "On" : "Off"}</Badge></li>
            <li className="flex justify-between"><span className="text-slate-600">Broker features</span><Badge tone={features.brokers ? "green" : "gray"}>{features.brokers ? "On" : "Off"}</Badge></li>
            <li className="flex justify-between"><span className="text-slate-600">Journey tracking</span><Badge tone={features.tracking ? "green" : "gray"}>{features.tracking ? "On" : "Off"}</Badge></li>
            <li className="flex justify-between"><span className="text-slate-600">Cities</span><span className="text-slate-800">{cities.map((c) => c.name).join(", ") || "None"}</span></li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
