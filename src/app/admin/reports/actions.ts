"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { logAdminAction } from "@/lib/db/admin";
import {
  transitionReportStatus,
  addReportNote,
  assignReport,
} from "@/lib/db/reports";
import type { ReportStatus } from "@/lib/reports-machine";
import { REPORT_STATUSES } from "@/lib/reports-machine";

const s = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);

function bust(reportId: string) {
  revalidatePath("/admin/reports");
  revalidatePath(`/admin/reports/${reportId}`);
}

export async function transitionReportAction(f: FormData): Promise<void> {
  await requireAdmin();
  const reportId = s(f, "id", 64);
  const toStatus = s(f, "status", 40) as ReportStatus;
  const reason = s(f, "reason", 2000);

  if (!REPORT_STATUSES.includes(toStatus)) return;

  const session = await getSession();
  if (!session) return;

  const result = await transitionReportStatus(reportId, session.id, toStatus, reason);
  if (!result.ok) {
    // Redirect back with error — simple approach for server actions
    redirect(`/admin/reports/${reportId}?error=${encodeURIComponent(result.error)}`);
  }

  await logAdminAction(session.id, `report_${toStatus}`, "report", reportId, {
    to_status: toStatus,
    reason: reason || undefined,
  });

  bust(reportId);
}

export async function addNoteAction(f: FormData): Promise<void> {
  await requireAdmin();
  const reportId = s(f, "id", 64);
  const note = s(f, "note", 2000);

  const session = await getSession();
  if (!session) return;

  await addReportNote(reportId, session.id, note);
  bust(reportId);
}

export async function assignReportAction(f: FormData): Promise<void> {
  await requireAdmin();
  const reportId = s(f, "id", 64);
  const assigneeId = s(f, "assignee_id", 64) || null;

  const session = await getSession();
  const result = await assignReport(reportId, assigneeId);
  if (!result.ok) {
    redirect(`/admin/reports/${reportId}?error=${encodeURIComponent(result.error ?? "Assignment failed")}`);
  }
  if (session) {
    await logAdminAction(session.id, "report_assigned", "report", reportId, { assignee_id: assigneeId });
  }
  bust(reportId);
}
