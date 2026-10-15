import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { getReport, getReportNotes } from "@/lib/db/reports";
import { PageHeader, Badge, Card } from "../../ui";
import {
  STATUS_LABELS, CATEGORY_LABELS, SEVERITY_LABELS,
  VALID_TRANSITIONS, transitionRequiresReason, isTerminal,
  type ReportStatus, type ReportCategory, type ReportSeverity,
} from "@/lib/reports-machine";
import { transitionReportAction, addNoteAction, assignReportAction } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<ReportStatus, "amber" | "blue" | "red" | "green" | "gray"> = {
  open: "amber", investigating: "blue", awaiting_information: "amber",
  escalated: "red", resolved: "green", dismissed: "gray",
};
const SEVERITY_TONE: Record<ReportSeverity, "red" | "amber" | "blue" | "gray"> = {
  critical: "red", high: "red", medium: "amber", low: "gray",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const [report, notes, session] = await Promise.all([getReport(id), getReportNotes(id), getSession()]);
  if (!report) notFound();

  const nextStatuses = VALID_TRANSITIONS[report.status as ReportStatus] ?? [];
  const terminal = isTerminal(report.status as ReportStatus);

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`Report ${report.ref}`}
        subtitle={`${CATEGORY_LABELS[report.category as ReportCategory]} · Filed ${fmt(report.created_at)}`}
        actions={
          <Link href="/admin/reports" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            ← All reports
          </Link>
        }
      />

      {sp.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {decodeURIComponent(sp.error)}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: details + description */}
        <div className="space-y-6 lg:col-span-2">
          <Card title="Report Details">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
                <dd className="mt-1">
                  <Badge tone={STATUS_TONE[report.status as ReportStatus]}>
                    {STATUS_LABELS[report.status as ReportStatus]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Severity</dt>
                <dd className="mt-1">
                  <Badge tone={SEVERITY_TONE[report.severity as ReportSeverity]}>
                    {SEVERITY_LABELS[report.severity as ReportSeverity]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reporter</dt>
                <dd className="mt-1 text-slate-700">
                  {report.reporter_name ?? report.reporter_email ?? "Anonymous"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned to</dt>
                <dd className="mt-1 text-slate-700">{report.assigned_name ?? "—"}</dd>
              </div>
              {report.property_title && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reported listing</dt>
                  <dd className="mt-1 text-slate-700">{report.property_title}</dd>
                </div>
              )}
              {report.reported_user_name && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reported user</dt>
                  <dd className="mt-1 text-slate-700">{report.reported_user_name}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.description}</p>
            </div>
            {report.resolution && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-green-700">Resolution</h3>
                <p className="mt-1 text-sm text-green-800">{report.resolution}</p>
                {report.resolved_at && (
                  <p className="mt-1 text-xs text-green-600">{fmt(report.resolved_at)}</p>
                )}
              </div>
            )}
          </Card>

          {/* Investigation timeline */}
          <Card title="Investigation Timeline">
            {notes.length === 0 ? (
              <p className="text-sm text-slate-400">No notes yet.</p>
            ) : (
              <ol className="space-y-4">
                {notes.map((n) => (
                  <li key={n.id} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 flex-none rounded-full bg-slate-300" />
                    <div className="flex-1">
                      {n.is_status_change ? (
                        <p className="text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{n.admin_name ?? "Admin"}</span>
                          {" moved to "}
                          <Badge tone={STATUS_TONE[n.to_status as ReportStatus]}>
                            {STATUS_LABELS[n.to_status as ReportStatus] ?? n.to_status}
                          </Badge>
                        </p>
                      ) : (
                        <p className="text-xs font-medium text-slate-700">{n.admin_name ?? "Admin"}</p>
                      )}
                      {n.note && !n.is_status_change && (
                        <p className="mt-1 text-sm text-slate-600">{n.note}</p>
                      )}
                      {n.is_status_change && n.note && (
                        <p className="mt-1 text-xs text-slate-500 italic">{n.note}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">{fmt(n.created_at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {/* Add note form */}
            <form action={addNoteAction} className="mt-5 border-t border-slate-100 pt-5">
              <input type="hidden" name="id" value={report.id} />
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                Add internal note
              </label>
              <textarea
                name="note"
                rows={3}
                required
                minLength={1}
                maxLength={2000}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                placeholder="Investigation notes visible only to admins…"
              />
              <button
                type="submit"
                className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Add note
              </button>
            </form>
          </Card>
        </div>

        {/* Right: actions */}
        <div className="space-y-4">
          {/* Status transitions */}
          {!terminal && (
            <Card title="Change Status">
              <div className="space-y-3">
                {nextStatuses.map((toStatus) => {
                  const needsReason = transitionRequiresReason(report.status as ReportStatus, toStatus);
                  return (
                    <form key={toStatus} action={transitionReportAction}>
                      <input type="hidden" name="id" value={report.id} />
                      <input type="hidden" name="status" value={toStatus} />
                      {needsReason && (
                        <textarea
                          name="reason"
                          required
                          rows={2}
                          className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                          placeholder={`Reason for moving to "${STATUS_LABELS[toStatus]}"…`}
                        />
                      )}
                      <button
                        type="submit"
                        className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                          toStatus === "dismissed"
                            ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : toStatus === "resolved"
                            ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                            : toStatus === "escalated"
                            ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        → {STATUS_LABELS[toStatus]}
                      </button>
                    </form>
                  );
                })}
              </div>
            </Card>
          )}

          {terminal && (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <Badge tone={STATUS_TONE[report.status as ReportStatus]}>
                {STATUS_LABELS[report.status as ReportStatus]}
              </Badge>
              <p className="mt-2 text-xs text-slate-500">This report is closed and cannot be reopened.</p>
            </div>
          )}

          {/* Assignment */}
          <Card title="Assignment">
            <p className="mb-3 text-xs text-slate-500">
              {report.assigned_to
                ? <>Assigned to <span className="font-medium text-slate-700">{report.assigned_name ?? report.assigned_to.slice(0, 8)}</span></>
                : "Unassigned"}
            </p>
            {session && (
              <div className="flex flex-col gap-2">
                {report.assigned_to !== session.id && (
                  <form action={assignReportAction}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="assignee_id" value={session.id} />
                    <button type="submit" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                      Assign to me
                    </button>
                  </form>
                )}
                {report.assigned_to && (
                  <form action={assignReportAction}>
                    <input type="hidden" name="id" value={report.id} />
                    <input type="hidden" name="assignee_id" value="" />
                    <button type="submit" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                      Unassign
                    </button>
                  </form>
                )}
              </div>
            )}
          </Card>

          {/* Quick metadata */}
          <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.06)] space-y-3 text-xs text-slate-500">
            <div>
              <span className="font-medium text-slate-700">Ref:</span> {report.ref}
            </div>
            <div>
              <span className="font-medium text-slate-700">Filed:</span> {fmt(report.created_at)}
            </div>
            <div>
              <span className="font-medium text-slate-700">Updated:</span> {fmt(report.updated_at)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
