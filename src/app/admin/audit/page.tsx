import { requireAdmin } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { PageHeader, Badge } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit Logs — Admin" };

const ACTION_TONE: Record<string, "green" | "red" | "amber" | "blue" | "gray"> = {
  approve_listing: "green", reject_listing: "red",
  grant_capability: "blue", revoke_capability: "amber",
  set_listing_sold: "gray", set_listing_draft: "gray",
  doc_verified: "green", doc_rejected: "red", doc_action_required: "amber",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

type AuditRow = {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  admin_id: string | null;
  created_at: string;
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = 50;
  const from = (page - 1) * perPage;

  const svc = createServiceClient();
  const { data: rows, count } = await svc
    .from("admin_audit_log")
    .select("id,action,target_type,target_id,admin_id,created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + perPage - 1);

  /* Resolve admin names from profiles (profiles.id = auth.users.id = admin_audit_log.admin_id) */
  const adminIds = [...new Set((rows ?? []).map((r: AuditRow) => r.admin_id).filter((id): id is string => Boolean(id)))];
  const adminNames = new Map<string, string>();
  if (adminIds.length > 0) {
    const { data: profiles } = await svc.from("profiles").select("id,full_name").in("id", adminIds);
    for (const p of profiles ?? []) adminNames.set(p.id, p.full_name ?? "Admin");
  }

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <main className="mx-auto max-w-5xl">
      <PageHeader
        title="Audit Logs"
        subtitle="Every admin action, who did it, and when. Read-only — nothing can be deleted."
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {(!rows || rows.length === 0) ? (
          <div className="px-6 py-16 text-center text-sm text-slate-500">
            No audit events yet. Admin actions (approve/reject listings, capability changes) will appear here.
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.07em] text-slate-500">
                  <th className="px-4 py-3">Action</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Target</th>
                  <th className="hidden px-4 py-3 md:table-cell">Actor</th>
                  <th className="px-4 py-3 text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(rows as AuditRow[]).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Badge tone={ACTION_TONE[row.action] ?? "gray"}>
                        {row.action.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span className="font-mono text-xs text-slate-500">
                        {row.target_type}
                        {row.target_id && ` · ${row.target_id.slice(0, 8)}…`}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell text-slate-600">
                      {row.admin_id ? (adminNames.get(row.admin_id) ?? row.admin_id.slice(0, 8)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 tabular-nums">
                      {fmt(row.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages} · {count} events total
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a href={`?page=${page - 1}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Previous
                    </a>
                  )}
                  {page < totalPages && (
                    <a href={`?page=${page + 1}`} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
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
