import { requireAdmin } from "@/lib/auth";
import { listReports, reportCounts } from "@/lib/db/reports";
import { PageHeader, Badge } from "../ui";
import type { ReportStatus, ReportCategory, ReportSeverity } from "@/lib/reports-machine";
import { STATUS_LABELS, CATEGORY_LABELS, SEVERITY_LABELS } from "@/lib/reports-machine";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports & Complaints — Admin" };

const STATUS_TONE: Record<ReportStatus, "amber" | "blue" | "red" | "green" | "gray"> = {
  open: "amber",
  investigating: "blue",
  awaiting_information: "amber",
  escalated: "red",
  resolved: "green",
  dismissed: "gray",
};

const SEVERITY_TONE: Record<ReportSeverity, "red" | "amber" | "blue" | "gray"> = {
  critical: "red",
  high: "red",
  medium: "amber",
  low: "gray",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

type SP = { status?: string; category?: string; severity?: string; page?: string };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const [counts, result] = await Promise.all([
    reportCounts(),
    listReports({
      status: sp.status,
      category: sp.category,
      severity: sp.severity,
      page,
      perPage: 25,
    }),
  ]);

  const reports = result?.reports ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / 25);

  const filterHref = (extra: Record<string, string>) => {
    const params = new URLSearchParams({ ...(sp as Record<string, string>), page: "1", ...extra });
    for (const [k, v] of params.entries()) if (!v || v === "all") params.delete(k);
    const s = params.toString();
    return s ? `?${s}` : "/admin/reports";
  };

  return (
    <main className="mx-auto max-w-5xl">
      <PageHeader
        title="Reports & Complaints"
        subtitle="User-submitted complaints about listings and accounts."
      />

      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Open", value: counts?.open ?? 0, tone: "amber" },
          { label: "Investigating", value: counts?.investigating ?? 0, tone: "blue" },
          { label: "Escalated", value: counts?.escalated ?? 0, tone: "red" },
          { label: "Total", value: counts?.total ?? 0, tone: "gray" },
        ].map(({ label, value, tone }) => (
          <div
            key={label}
            className={`rounded-2xl border bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] ${
              tone === "amber" ? "border-amber-200" : tone === "blue" ? "border-blue-200" : tone === "red" ? "border-red-200" : "border-slate-200/80"
            }`}
          >
            <div className="text-[28px] font-semibold tabular-nums text-slate-900">{value}</div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {/* Status */}
        {(["all", "open", "investigating", "escalated", "awaiting_information", "resolved", "dismissed"] as const).map((s) => (
          <a
            key={s}
            href={filterHref({ status: s === "all" ? "" : s })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              (sp.status ?? "") === (s === "all" ? "" : s)
                ? "border-slate-700 bg-slate-800 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all" ? "All statuses" : STATUS_LABELS[s as ReportStatus]}
          </a>
        ))}
        <span className="text-slate-300">|</span>
        {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
          <a
            key={s}
            href={filterHref({ severity: s === "all" ? "" : s })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              (sp.severity ?? "") === (s === "all" ? "" : s)
                ? "border-slate-700 bg-slate-800 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s === "all" ? "All severities" : SEVERITY_LABELS[s as ReportSeverity]}
          </a>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {reports.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No reports match the current filters.
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500">
                  <th className="px-4 py-3">Ref</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Status</th>
                  <th className="hidden px-4 py-3 md:table-cell">Severity</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Assigned</th>
                  <th className="px-4 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/reports/${r.id}`}
                        className="font-mono text-xs font-semibold text-blue-600 hover:underline"
                      >
                        {r.ref}
                      </Link>
                      <div className="mt-0.5 max-w-[200px] truncate text-xs text-slate-400">
                        {r.property_title ?? r.reported_user_name ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {CATEGORY_LABELS[r.category as ReportCategory]}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge tone={STATUS_TONE[r.status as ReportStatus]}>
                        {STATUS_LABELS[r.status as ReportStatus]}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <Badge tone={SEVERITY_TONE[r.severity as ReportSeverity]}>
                        {SEVERITY_LABELS[r.severity as ReportSeverity]}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell text-xs text-slate-500">
                      {r.assigned_name ?? <span className="text-slate-300">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 tabular-nums">
                      {fmt(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages} · {total} reports total
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a href={filterHref({ page: String(page - 1) })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Previous
                    </a>
                  )}
                  {page < totalPages && (
                    <a href={filterHref({ page: String(page + 1) })} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Next
                    </a>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
