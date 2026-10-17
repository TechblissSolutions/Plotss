import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { searchUsers } from "@/lib/db/admin";
import { AdminPageHeader, Badge, btn, EmptyState } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "People & Accounts — Admin" };

const ROLE_TONE = { admin: "red", broker: "blue", seller: "amber", buyer: "gray" } as const;
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const th = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500";

function statusTone(u: { suspended_at: string | null; deleted_at: string | null }) {
  if (u.deleted_at) return "red";
  if (u.suspended_at) return "amber";
  return "green";
}
function statusLabel(u: { suspended_at: string | null; deleted_at: string | null }) {
  if (u.deleted_at) return "Deleted";
  if (u.suspended_at) return "Suspended";
  return "Active";
}

export default async function PeopleAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; status?: string; capability?: string; page?: string;
  }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = (sp.status as "all" | "active" | "suspended" | "deleted") || "all";
  const capability = sp.capability as "can_buy" | "can_sell" | "is_broker_staff" | undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const perPage = 25;

  const { rows: users, total } = await searchUsers({ q, status, capability, page, perPage });
  const totalPages = Math.ceil(total / perPage);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, status, capability, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v && v !== "all" && v !== "1") p.set(k, v);
    const qs = p.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  };

  return (
    <main className="mx-auto max-w-5xl">
      <AdminPageHeader
        title="People & Accounts"
        subtitle={`${total} ${total === 1 ? "person" : "people"} — click a row to manage their account`}
      />

      {/* Filter bar */}
      <form method="GET" action="/admin/users" className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-48">
          <label htmlFor="q-input" className="mb-1.5 block text-xs font-medium text-slate-600">Search</label>
          <input
            id="q-input" name="q" defaultValue={q} placeholder="Name or phone…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="status-sel" className="mb-1.5 block text-xs font-medium text-slate-600">Status</label>
          <select id="status-sel" name="status" defaultValue={status}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>
        </div>
        <div>
          <label htmlFor="cap-sel" className="mb-1.5 block text-xs font-medium text-slate-600">Capability</label>
          <select id="cap-sel" name="capability" defaultValue={capability ?? ""}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none">
            <option value="">Any</option>
            <option value="can_buy">can_buy</option>
            <option value="can_sell">can_sell</option>
            <option value="is_broker_staff">broker staff</option>
          </select>
        </div>
        <button type="submit" className={btn.primary}>Filter</button>
        {(q || status !== "all" || capability) && (
          <Link href="/admin/users" className={btn.ghost}>Clear</Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {users.length === 0 ? (
          <EmptyState title="No people found">
            {q || status !== "all" || capability ? "Try a different filter." : "No one has signed up yet."}
          </EmptyState>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">People and accounts</caption>
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">
                    <th scope="col" className={th}>Person</th>
                    <th scope="col" className={`${th} hidden sm:table-cell`}>Joined</th>
                    <th scope="col" className={`${th} hidden md:table-cell`}>Role</th>
                    <th scope="col" className={th}>Status</th>
                    <th scope="col" className={`${th} hidden lg:table-cell`}>Capabilities</th>
                    <th scope="col" className={th}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{u.name || "Name not set"}</div>
                        <div className="text-xs text-slate-500">{u.email || u.phone || "—"}</div>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 sm:table-cell">{fmt(u.created_at)}</td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Badge tone={ROLE_TONE[u.role as keyof typeof ROLE_TONE] ?? "gray"}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusTone(u)}>{statusLabel(u)}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {u.can_buy && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">buy</span>}
                          {u.can_sell && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">sell</span>}
                          {u.is_broker_staff && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">broker</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/users/${u.id}`}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                <span className="text-xs text-slate-500">
                  Page {page} of {totalPages} · {total} people
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <a href={buildUrl({ page: String(page - 1) })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Previous
                    </a>
                  )}
                  {page < totalPages && (
                    <a href={buildUrl({ page: String(page + 1) })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
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
