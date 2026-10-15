import Link from "next/link";
import { aiProviderName } from "@/lib/ai/llm";
import { loadEvents } from "@/lib/analytics/load";
import { buildReport } from "@/lib/analytics/report";
import { requireAuthAdminName } from "@/lib/auth-admin";
import { getCities } from "@/lib/db/cities";
import { adminListings, analytics } from "@/lib/db/admin";
import { isDbReady } from "@/lib/db/listings";
import { createServiceClient } from "@/lib/supabase/service";
import { formatINR } from "@/lib/format";
import { getFeatures } from "@/lib/features";
import { getSeoGlobal } from "@/lib/seo";
import { daysAgo } from "@/lib/time";
import { Badge, btn, Card, PageHeader } from "./ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview — Admin" };

/* ── helpers ── */
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const fmtRelative = (iso: string) => {
  const diff = Date.now() - Date.parse(iso);
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};

const ACTION_LABELS: Record<string, string> = {
  approve_listing: "Approved listing",
  reject_listing: "Rejected listing",
  set_listing_sold: "Marked sold",
  set_listing_draft: "Moved to draft",
  grant_capability: "Granted capability",
  revoke_capability: "Revoked capability",
};

const ACTION_TONE: Record<string, "green" | "red" | "amber" | "blue" | "gray"> = {
  approve_listing: "green",
  reject_listing: "red",
  grant_capability: "blue",
  revoke_capability: "amber",
};

/* ── metric tile ── */
function MetricTile({
  label,
  value,
  note,
  tone = "neutral",
  href,
  hero = false,
}: {
  label: string;
  value: string | number;
  note?: string;
  tone?: "amber" | "green" | "blue" | "neutral";
  href?: string;
  hero?: boolean;
}) {
  const accent =
    tone === "amber" ? "border-amber-300 bg-amber-50" :
    tone === "green" ? "border-emerald-300 bg-emerald-50" :
    tone === "blue" ? "border-blue-300 bg-blue-50" :
    "border-slate-200/80 bg-white";

  const valueCls =
    tone === "amber" ? "text-amber-700" :
    tone === "green" ? "text-emerald-700" :
    tone === "blue" ? "text-blue-700" :
    "text-slate-900";

  const content = (
    <div
      className={`rounded-2xl border p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] ${accent} ${hero ? "py-6" : ""}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</div>
      <div className={`mt-2 font-semibold tracking-[-0.03em] ${hero ? "text-[40px] leading-none" : "text-[28px] leading-8"} ${valueCls}`}>
        {value}
      </div>
      {note && <div className="mt-1 text-xs text-slate-500">{note}</div>}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

/* ── status bar ── */
function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="group">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="tabular-nums font-medium text-slate-800">{count}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ── funnel row ── */
function FunnelRow({ label, sessions, max }: { label: string; sessions: number; max: number }) {
  const pct = max > 0 ? (sessions / max) * 100 : 0;
  return (
    <li>
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <span className="tabular-nums font-medium text-slate-800">{sessions.toLocaleString()}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-800 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

/* ── page ── */
export default async function AdminHome() {
  const name = await requireAuthAdminName();
  const refreshedAt = new Date();

  /* Independent fetches — each failure is isolated */
  const [ready, features, cities, seo, pending, a, ev, auditRows] = await Promise.all([
    isDbReady().catch(() => false),
    getFeatures().catch(() => null),
    getCities().catch(() => []),
    getSeoGlobal().catch(() => null),
    adminListings("pending").catch(() => []),
    analytics().catch(() => null),
    loadEvents(7).catch(() => null),
    (async () => {
      try {
        const svc = createServiceClient();
        const { data } = await svc
          .from("admin_audit_log")
          .select("id,action,target_type,target_id,created_at,admin:profiles!admin_audit_log_admin_id_fkey(full_name)")
          .order("created_at", { ascending: false })
          .limit(8);
        return data ?? [];
      } catch { return []; }
    })(),
  ]);

  const report = ev ? buildReport(ev.events) : null;
  const props = (a?.props ?? []) as { status: string; is_verified?: boolean; details?: { demo?: boolean } }[];
  const live = props.filter((p) => p.status === "live").length;
  const draft = props.filter((p) => p.status === "draft").length;
  const rejected = props.filter((p) => p.status === "rejected").length;
  const sold = props.filter((p) => p.status === "sold").length;
  const total = props.length;

  const week = daysAgo(7);
  const enquiries30d = (a?.enquiries ?? []).length;
  const leads7 = (a?.enquiries ?? []).filter((e) => Date.parse(e.created_at as string) > week).length;

  /* Config warnings for action queue */
  type ConfigWarning = { label: string; hint: string; href: string };
  const configWarnings: ConfigWarning[] = [];
  if (!ready) configWarnings.push({ label: "Database migrations not applied", hint: "Run 0002 and 0003 in Supabase", href: "/admin/health" });
  if (!aiProviderName()) configWarnings.push({ label: "No AI provider configured", hint: "Add GROQ_API_KEY or XAI_API_KEY", href: "/admin/settings" });
  if (cities.length === 0) configWarnings.push({ label: "No active launch cities", hint: "Activate a city in Launch settings", href: "/admin/settings" });
  if (seo && seo.siteUrl.includes("localhost")) configWarnings.push({ label: "Site URL still set to localhost", hint: "Set the real domain under SEO before launch", href: "/admin/seo" });

  /* Launch readiness checks */
  const checks = [
    { ok: ready, label: "Migrations applied", hint: "Run 0002, 0003 in Supabase" },
    { ok: ev !== null, label: "Journey tracking active", href: "/admin/journey" },
    { ok: Boolean(aiProviderName()), label: "AI provider connected", href: "/admin/settings" },
    { ok: cities.length > 0, label: `${cities.length || "No"} launch cit${cities.length === 1 ? "y" : "ies"}`, href: "/admin/settings" },
    { ok: seo ? !seo.siteUrl.includes("localhost") : false, label: "Public domain set", href: "/admin/seo" },
    { ok: live > 0, label: `${live || "No"} live listing${live === 1 ? "" : "s"}`, href: "/admin/listings" },
    { ok: !props.some((p) => p.details?.demo), label: "No demo listings live", href: "/admin/listings" },
  ];
  const readinessScore = checks.filter((c) => c.ok).length;

  const hour = refreshedAt.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <main className="mx-auto max-w-7xl">
      <PageHeader
        title={`${greeting}, ${name}`}
        subtitle={`Overview · refreshed ${fmt(refreshedAt.toISOString())}`}
        actions={
          <Link href="/admin/listings" className={btn.primary}>
            Open queue{pending.length > 0 && ` (${pending.length})`}
          </Link>
        }
      />

      {/* ── Metric strip ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Awaiting review"
          value={pending.length}
          note={pending.length === 0 ? "Queue is clear" : `${pending.length} listing${pending.length === 1 ? "" : "s"} to review`}
          tone={pending.length > 0 ? "amber" : "neutral"}
          href="/admin/listings?status=pending"
          hero
        />
        <MetricTile
          label="Live listings"
          value={live}
          note={`${total} total · ${sold} sold`}
          tone={live > 0 ? "green" : "neutral"}
          href="/admin/listings?status=live"
          hero
        />
        <MetricTile
          label="Enquiries (30d)"
          value={enquiries30d}
          note={`${leads7} in the last 7 days`}
          tone="blue"
          href="/admin/notifications"
          hero
        />
        <MetricTile
          label="Visitors (7d)"
          value={report?.overview.visitors ?? "—"}
          note={report ? `${report.overview.pageViews} page views · ${report.overview.bounceRate}% bounce` : "No tracking data yet"}
          href="/admin/analytics"
          hero
        />
      </div>

      {/* ── Action queue ── */}
      {(pending.length > 0 || configWarnings.length > 0) && (
        <div className="mt-6">
          <Card
            title="Action queue"
            note={`${pending.length} listing approval${pending.length === 1 ? "" : "s"}${configWarnings.length > 0 ? ` · ${configWarnings.length} config issue${configWarnings.length === 1 ? "" : "s"}` : ""}`}
          >
            {/* Config blockers */}
            {configWarnings.length > 0 && (
              <div className="mb-4 space-y-2">
                {configWarnings.map((w) => (
                  <Link
                    key={w.label}
                    href={w.href}
                    className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm transition-colors hover:bg-amber-100"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500 text-[11px] font-bold text-white">!</span>
                    <span>
                      <span className="font-medium text-amber-900">{w.label}</span>
                      <span className="ml-1.5 text-amber-700">{w.hint}</span>
                    </span>
                    <span className="ml-auto shrink-0 text-xs font-medium text-amber-700">Fix →</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Pending listings */}
            {pending.length > 0 && (
              <ul className="divide-y divide-slate-100">
                {pending.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">{p.title}</span>
                        {features?.aiScreening && p.screen && (
                          <Badge tone={p.screen.risk >= 60 ? "red" : p.screen.risk >= 40 ? "amber" : "green"}>
                            Risk {p.screen.risk}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {p.city} · {p.category} · {formatINR(p.price)} · {p.owner} · {fmtRelative(p.created_at)}
                      </div>
                    </div>
                    <Link href="/admin/listings" className={`${btn.small} shrink-0`}>Review</Link>
                  </li>
                ))}
              </ul>
            )}

            {pending.length > 6 && (
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Link href="/admin/listings?status=pending" className="text-sm font-medium text-blue-600 hover:underline">
                  View all {pending.length} pending listings →
                </Link>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Listing status + Funnel ── */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">

        {/* Listing status breakdown */}
        <Card title="Listing inventory" note={`${total} total across all statuses`}>
          {total === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No listings yet. They&apos;ll appear here once sellers submit them.</p>
          ) : (
            <div className="space-y-4">
              <StatusBar label="Live" count={live} total={total} color="bg-emerald-500" />
              <StatusBar label="Pending review" count={pending.length} total={total} color="bg-amber-400" />
              <StatusBar label="Draft" count={draft} total={total} color="bg-slate-400" />
              <StatusBar label="Rejected" count={rejected} total={total} color="bg-red-400" />
              <StatusBar label="Sold" count={sold} total={total} color="bg-blue-400" />
            </div>
          )}
          {total > 0 && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              <Link href="/admin/listings" className={btn.small}>All listings</Link>
              <Link href="/admin/listings?status=live" className={btn.small}>Live</Link>
              <Link href="/admin/listings?status=pending" className={btn.small}>Pending</Link>
            </div>
          )}
        </Card>

        {/* Buyer funnel */}
        <Card title="Buyer journey" note="Conversion funnel · last 7 days">
          {report && report.buyerFunnel[0].sessions > 0 ? (
            <>
              <ul className="space-y-3.5">
                {report.buyerFunnel.map((s) => (
                  <FunnelRow
                    key={s.key}
                    label={s.label}
                    sessions={s.sessions}
                    max={report.buyerFunnel[0].sessions}
                  />
                ))}
              </ul>
              {report.buyerFunnel[0].sessions > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Visit → enquiry conversion</span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {report.buyerFunnel[0].sessions > 0
                        ? `${((report.buyerFunnel[6]?.sessions ?? 0) / report.buyerFunnel[0].sessions * 100).toFixed(1)}%`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}
              <Link href="/admin/journey" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
                Full journey report →
              </Link>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">
              No journey data for the last 7 days.{" "}
              {features?.tracking ? "Visitors appear after they accept the analytics banner." : "Enable journey tracking in Feature Controls."}
            </p>
          )}
        </Card>
      </div>

      {/* ── Audit activity + Launch readiness ── */}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">

        {/* Recent audit activity */}
        <Card title="Recent admin actions" note="Last 8 actions across all admins">
          {auditRows.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              No admin actions recorded yet. Approvals, rejections, and role changes appear here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(auditRows as {
                id: string;
                action: string;
                target_type: string;
                target_id: string | null;
                created_at: string;
                admin: { full_name?: string } | null;
              }[]).map((row) => (
                <li key={row.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={ACTION_TONE[row.action] ?? "gray"}>
                        {ACTION_LABELS[row.action] ?? row.action.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {row.admin?.full_name ?? "Admin"} · {row.target_type}
                      {row.target_id && <span className="font-mono"> {row.target_id.slice(0, 8)}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400 tabular-nums">{fmtRelative(row.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 border-t border-slate-100 pt-4">
            <Link href="/admin/audit" className="text-sm font-medium text-blue-600 hover:underline">
              Full audit log →
            </Link>
          </div>
        </Card>

        {/* Launch readiness */}
        <Card
          title="Launch readiness"
          note={`${readinessScore} of ${checks.length} checks passing`}
        >
          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Overall</span>
              <span className={`font-semibold ${readinessScore === checks.length ? "text-emerald-600" : "text-amber-600"}`}>
                {Math.round((readinessScore / checks.length) * 100)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${readinessScore === checks.length ? "bg-emerald-500" : "bg-amber-400"}`}
                style={{ width: `${(readinessScore / checks.length) * 100}%` }}
              />
            </div>
          </div>

          <ul className="space-y-2.5">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2.5 text-sm">
                <span
                  className={`mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${
                    c.ok ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                >
                  {c.ok ? "✓" : "!"}
                </span>
                <span className="flex-1 min-w-0">
                  <span className={c.ok ? "text-slate-600" : "font-medium text-slate-900"}>{c.label}</span>
                  {!c.ok && c.hint && (
                    <span className="block text-xs text-slate-500 mt-0.5">{c.hint}</span>
                  )}
                </span>
                {!c.ok && c.href && (
                  <Link href={c.href} className="shrink-0 text-xs font-medium text-blue-600 hover:underline">
                    Fix
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ── Quick actions ── */}
      <div className="mt-6">
        <Card title="Quick actions">
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/blog/new" className={btn.secondary}>Write blog post</Link>
            <Link href="/admin/content" className={btn.secondary}>Edit homepage</Link>
            <Link href="/admin/seo" className={btn.secondary}>SEO settings</Link>
            <Link href="/admin/settings" className={btn.secondary}>Feature controls</Link>
            <Link href="/admin/health" className={btn.secondary}>System health</Link>
            <Link href="/admin/analytics" className={btn.secondary}>Analytics</Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
