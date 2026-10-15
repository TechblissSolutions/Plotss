import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { isDbReady } from "./listings";
import { REPORT_STATUSES } from "@/lib/reports-machine";
import type { ReportCategory, ReportSeverity, ReportStatus } from "@/lib/reports-machine";

export type Report = {
  id: string;
  ref: string;
  status: ReportStatus;
  category: ReportCategory;
  severity: ReportSeverity;
  description: string;
  created_at: string;
  updated_at: string;
  reporter_id: string | null;
  reporter_email: string | null;
  reporter_name: string | null;
  property_id: string | null;
  property_title: string | null;
  property_slug: string | null;
  reported_user_id: string | null;
  reported_user_name: string | null;
  assigned_to: string | null;
  assigned_name: string | null;
  resolved_by: string | null;
  resolution: string | null;
  resolved_at: string | null;
};

export type ReportNote = {
  id: string;
  report_id: string;
  admin_id: string | null;
  admin_name: string | null;
  note: string;
  is_status_change: boolean;
  from_status: string | null;
  to_status: string | null;
  created_at: string;
};

export type ReportCounts = {
  open: number;
  investigating: number;
  escalated: number;
  total: number;
};

/* ── Counts for dashboard strip — uses aggregate queries, not full table scan ── */
export async function reportCounts(): Promise<ReportCounts | null> {
  if (!(await isDbReady())) return null;
  const svc = createServiceClient();
  const countWhere = async (status: string) => {
    const { count } = await svc.from("reports").select("id", { count: "exact", head: true }).eq("status", status);
    return count ?? 0;
  };
  const totalQ = await svc.from("reports").select("id", { count: "exact", head: true });
  const [open, investigating, escalated] = await Promise.all([
    countWhere("open"),
    countWhere("investigating"),
    countWhere("escalated"),
  ]);
  return { open, investigating, escalated, total: totalQ.count ?? 0 };
}

/* ── Queue listing ── */
export async function listReports(opts: {
  status?: string;
  category?: string;
  severity?: string;
  page?: number;
  perPage?: number;
}): Promise<{ reports: Report[]; total: number } | null> {
  if (!(await isDbReady())) return null;
  const svc = createServiceClient();
  const page = Math.max(1, opts.page ?? 1);
  const perPage = Math.min(50, Math.max(1, opts.perPage ?? 25));
  const from = (page - 1) * perPage;

  let q = svc
    .from("reports")
    .select(
      `id, ref, status, category, severity, description, created_at, updated_at,
       reporter_id, reporter_email,
       property_id, property:properties!reports_property_id_fkey(title,slug),
       reported_user_id, reported_user:profiles!reports_reported_user_id_fkey(full_name),
       assigned_to, assigned:profiles!reports_assigned_to_fkey(full_name),
       reporter:profiles!reports_reporter_id_fkey(full_name),
       resolved_by, resolution, resolved_at`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  if (opts.status && opts.status !== "all") q = q.eq("status", opts.status);
  if (opts.category && opts.category !== "all") q = q.eq("category", opts.category);
  if (opts.severity && opts.severity !== "all") q = q.eq("severity", opts.severity);

  const { data, error, count } = await q;
  if (error) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped: Report[] = (data ?? []).map((r: any) => ({
    id: r.id, ref: r.ref, status: r.status, category: r.category, severity: r.severity,
    description: r.description, created_at: r.created_at, updated_at: r.updated_at,
    reporter_id: r.reporter_id, reporter_email: r.reporter_email,
    reporter_name: r.reporter?.full_name ?? null,
    property_id: r.property_id, property_title: r.property?.title ?? null, property_slug: r.property?.slug ?? null,
    reported_user_id: r.reported_user_id, reported_user_name: r.reported_user?.full_name ?? null,
    assigned_to: r.assigned_to, assigned_name: r.assigned?.full_name ?? null,
    resolved_by: r.resolved_by, resolution: r.resolution, resolved_at: r.resolved_at,
  }));

  return { reports: mapped, total: count ?? 0 };
}

/* ── Single report detail ── */
export async function getReport(id: string): Promise<Report | null> {
  if (!(await isDbReady())) return null;
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("reports")
    .select(
      `id, ref, status, category, severity, description, created_at, updated_at,
       reporter_id, reporter_email,
       property_id, property:properties!reports_property_id_fkey(title,slug),
       reported_user_id, reported_user:profiles!reports_reported_user_id_fkey(full_name),
       assigned_to, assigned:profiles!reports_assigned_to_fkey(full_name),
       reporter:profiles!reports_reporter_id_fkey(full_name),
       resolved_by, resolution, resolved_at`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = data as any;
  return {
    id: r.id, ref: r.ref, status: r.status, category: r.category, severity: r.severity,
    description: r.description, created_at: r.created_at, updated_at: r.updated_at,
    reporter_id: r.reporter_id, reporter_email: r.reporter_email,
    reporter_name: r.reporter?.full_name ?? null,
    property_id: r.property_id, property_title: r.property?.title ?? null, property_slug: r.property?.slug ?? null,
    reported_user_id: r.reported_user_id, reported_user_name: r.reported_user?.full_name ?? null,
    assigned_to: r.assigned_to, assigned_name: r.assigned?.full_name ?? null,
    resolved_by: r.resolved_by, resolution: r.resolution, resolved_at: r.resolved_at,
  };
}

/* ── Notes (investigation timeline) ── */
export async function getReportNotes(reportId: string): Promise<ReportNote[]> {
  if (!(await isDbReady())) return [];
  const svc = createServiceClient();
  const { data } = await svc
    .from("report_notes")
    .select("id, report_id, admin_id, note, is_status_change, from_status, to_status, created_at")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as (ReportNote & { admin_id: string | null })[];
  const adminIds = [...new Set(rows.map((r) => r.admin_id).filter((id): id is string => Boolean(id)))];
  const names = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: profiles } = await svc.from("profiles").select("id,full_name").in("id", adminIds);
    for (const p of profiles ?? []) names.set(p.id, p.full_name ?? "Admin");
  }

  return rows.map((r) => ({ ...r, admin_name: r.admin_id ? (names.get(r.admin_id) ?? "Admin") : null }));
}

/* ── Transition status — atomic via RPC (0015_reports_transition_rpc.sql) ── */
// Fast-path client-side validation before the DB round trip.
// The RPC mirrors this exact logic inside a single transaction with a row-level lock.
export async function transitionReportStatus(
  reportId: string,
  adminId: string,
  toStatus: ReportStatus,
  reason: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await isDbReady())) return { ok: false, error: "Database not ready" };

  // Client-side pre-validation (avoids DB round trip for obviously invalid input)
  if (!REPORT_STATUSES.includes(toStatus)) return { ok: false, error: `Unknown status: '${toStatus}'` };

  const svc = createServiceClient();
  const { data, error } = await svc.rpc("transition_report_status", {
    p_report_id: reportId,
    p_admin_id: adminId,
    p_to_status: toStatus,
    p_reason: reason,
  });

  if (error) {
    // RPC connectivity / permission error (distinct from business-logic rejection)
    return { ok: false, error: "Status change failed: " + error.message };
  }

  const result = data as { ok: boolean; error?: string } | null;
  if (!result?.ok) return { ok: false, error: result?.error ?? "Status change failed" };
  return { ok: true };
}

/* ── Add internal note ── */
export async function addReportNote(reportId: string, adminId: string, note: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await isDbReady())) return { ok: false, error: "Database not ready" };
  const trimmed = note.trim();
  if (!trimmed || trimmed.length > 2000) return { ok: false, error: "Note must be 1–2000 characters" };

  const { error } = await createServiceClient().from("report_notes").insert({
    report_id: reportId,
    admin_id: adminId,
    note: trimmed,
    is_status_change: false,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* ── Assign moderator ── */
export async function assignReport(reportId: string, assigneeId: string | null): Promise<{ ok: boolean; error?: string }> {
  const { error } = await createServiceClient()
    .from("reports")
    .update({ assigned_to: assigneeId, updated_at: new Date().toISOString() })
    .eq("id", reportId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* ── Create report (public submission) ── */
export type CreateReportInput = {
  category: ReportCategory;
  description: string;
  severity?: ReportSeverity;
  property_id?: string | null;
  reported_user_id?: string | null;
  reporter_id?: string | null;
  reporter_email?: string | null;
};

const RATE_LIMIT_WINDOW_HOURS = 24;
const RATE_LIMIT_MAX = 5;

/** Returns true if the reporter has exceeded the rate limit. */
async function isRateLimited(svc: ReturnType<typeof createServiceClient>, reporterId: string | null, reporterEmail: string | null): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  let q = svc.from("reports").select("id", { count: "exact", head: true }).gte("created_at", since);
  if (reporterId) q = q.eq("reporter_id", reporterId);
  else if (reporterEmail) q = q.eq("reporter_email", reporterEmail);
  else return false; // anonymous with no email — no per-identity throttle possible
  const { count } = await q;
  return (count ?? 0) >= RATE_LIMIT_MAX;
}

export async function createReport(input: CreateReportInput): Promise<{ id: string; ref: string } | { rateLimited: true } | null> {
  if (!(await isDbReady())) return null;
  const svc = createServiceClient();

  // Rate limit: max RATE_LIMIT_MAX reports per RATE_LIMIT_WINDOW_HOURS per reporter identity
  if (await isRateLimited(svc, input.reporter_id ?? null, input.reporter_email ?? null)) {
    return { rateLimited: true };
  }

  const { data, error } = await svc
    .from("reports")
    .insert({
      category: input.category,
      description: input.description.trim(),
      severity: input.severity ?? "medium",
      property_id: input.property_id ?? null,
      reported_user_id: input.reported_user_id ?? null,
      reporter_id: input.reporter_id ?? null,
      reporter_email: input.reporter_email?.trim() || null,
    })
    .select("id, ref")
    .single();
  if (error || !data) return null;
  return { id: data.id, ref: data.ref };
}

/* ── Signed URL for evidence (admin only — caller must have already requireAdmin()) ── */
export async function signedEvidenceUrl(filePath: string): Promise<string | null> {
  const { data } = await createServiceClient()
    .storage.from("complaint-evidence")
    .createSignedUrl(filePath, 900); // 15 minutes
  return data?.signedUrl ?? null;
}
