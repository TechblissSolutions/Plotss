import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getUserDetail, adminBrokers, getSuspendImpact } from "@/lib/db/admin";
import { Badge, btn, Card, PageHeader, Notice } from "../../ui";
import { suspendUserAction, reactivateUserAction, updateCapabilityAction, reassignBrokerAction } from "../actions";

export const dynamic = "force-dynamic";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ACTION_TONE: Record<string, "green" | "red" | "amber" | "blue" | "gray"> = {
  grant_capability: "green", revoke_capability: "red",
  suspend_user: "red", reactivate_user: "green",
  approve_listing: "green", reject_listing: "red",
};

function CapabilityRow({
  userId, label, capKey, value, brokers, brokerIdVal,
}: {
  userId: string; label: string; capKey: string; value: boolean;
  brokers?: { id: string; name: string }[];
  brokerIdVal?: string | null;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-slate-500 w-28">{capKey}</span>
        <Badge tone={value ? "green" : "gray"}>{value ? "Enabled" : "Disabled"}</Badge>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <form action={updateCapabilityAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="capability" value={capKey} />
        <input type="hidden" name="value" value={String(!value)} />
        {capKey === "is_broker_staff" && !value && brokers && (
          <select name="brokerId" defaultValue={brokerIdVal ?? ""} required
            className="mr-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">
            <option value="">— pick broker —</option>
            {brokers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <input name="reason" type="hidden" value="" />
        <button type="submit" className={value ? btn.danger : btn.success}>
          {value ? "Revoke" : "Grant"}
        </button>
      </form>
    </div>
  );
}

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [user, brokers, impact] = await Promise.all([
    getUserDetail(id),
    adminBrokers(),
    getSuspendImpact(id),
  ]);
  if (!user) notFound();

  const isDeleted = !!user.deleted_at;
  const isSuspended = !!user.suspended_at;

  return (
    <main className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/admin/users" className="text-xs text-slate-500 hover:text-slate-700">← People & Accounts</Link>
      </div>

      <PageHeader
        title={user.name || "Unnamed user"}
        subtitle={user.email || user.phone || user.id}
      />

      {/* Status banner */}
      {isSuspended && (
        <Notice tone="amber" className="mb-6">
          Account suspended since {fmt(user.suspended_at)}. The user cannot log in.
        </Notice>
      )}
      {isDeleted && (
        <Notice tone="red" className="mb-6">
          Account permanently deleted (DPDP). This is irreversible.
        </Notice>
      )}

      <div className="grid gap-6">
        {/* Profile info */}
        <Card title="Profile">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div><dt className="text-xs font-medium text-slate-500">Full name</dt><dd className="mt-0.5 text-slate-900">{user.name || "—"}</dd></div>
            <div><dt className="text-xs font-medium text-slate-500">Email</dt><dd className="mt-0.5 text-slate-900">{user.email || "—"}</dd></div>
            <div><dt className="text-xs font-medium text-slate-500">Phone</dt><dd className="mt-0.5 text-slate-900">{user.phone || "—"}</dd></div>
            <div><dt className="text-xs font-medium text-slate-500">Role</dt><dd className="mt-0.5"><Badge tone={user.role === "admin" ? "red" : user.role === "broker" ? "blue" : "gray"}>{user.role}</Badge></dd></div>
            <div><dt className="text-xs font-medium text-slate-500">Joined</dt><dd className="mt-0.5 text-slate-900">{fmt(user.created_at)}</dd></div>
            <div><dt className="text-xs font-medium text-slate-500">Status</dt><dd className="mt-0.5"><Badge tone={isDeleted ? "red" : isSuspended ? "amber" : "green"}>{isDeleted ? "Deleted" : isSuspended ? "Suspended" : "Active"}</Badge></dd></div>
            <div><dt className="text-xs font-medium text-slate-500">Listings</dt><dd className="mt-0.5 text-slate-900">{user.listingCount} total, {user.activeListingCount} live</dd></div>
          </dl>
        </Card>

        {/* Capabilities */}
        {!isDeleted && (
          <Card title="Capabilities" note="Each capability is independent. Revoking can_buy while broker staff is active is blocked.">
            <CapabilityRow userId={id} label="Can browse and enquire on listings" capKey="can_buy" value={user.capabilities.can_buy} />
            <CapabilityRow userId={id} label="Can post and manage listings" capKey="can_sell" value={user.capabilities.can_sell} />
            <CapabilityRow
              userId={id} label="Is broker/client staff"
              capKey="is_broker_staff" value={user.capabilities.is_broker_staff}
              brokers={brokers} brokerIdVal={user.capabilities.broker_id}
            />
          </Card>
        )}

        {/* Broker association */}
        {!isDeleted && user.capabilities.is_broker_staff && (
          <Card title="Broker Association">
            <p className="mb-4 text-sm text-slate-600">
              Currently associated with: <strong>{user.brokerName ?? "Unknown"}</strong>
            </p>
            <form action={reassignBrokerAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="userId" value={id} />
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Reassign to</label>
                <select name="brokerId" defaultValue={user.capabilities.broker_id ?? ""}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                  <option value="">— Remove broker staff —</option>
                  {brokers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Reason</label>
                <input name="reason" placeholder="Reason for change…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
              </div>
              <button type="submit" className={btn.primary}>Save</button>
            </form>
          </Card>
        )}

        {/* Suspend / Reactivate */}
        {!isDeleted && (
          <Card title={isSuspended ? "Reactivate Account" : "Suspend Account"}>
            {isSuspended ? (
              <div>
                <p className="mb-4 text-sm text-slate-600">
                  Reactivating will allow the user to log in again. The suspension record stays in the audit log.
                </p>
                <form action={reactivateUserAction}>
                  <input type="hidden" name="userId" value={id} />
                  <button type="submit" className={btn.success}>Reactivate account</button>
                </form>
              </div>
            ) : (
              <div>
                {(impact.activeListings > 0 || impact.pendingEnquiries > 0) && (
                  <Notice tone="amber" className="mb-4">
                    This user has {impact.activeListings} live listing{impact.activeListings !== 1 ? "s" : ""} and {impact.pendingEnquiries} pending enquir{impact.pendingEnquiries !== 1 ? "ies" : "y"}. Suspending will block their access but will not remove listings.
                  </Notice>
                )}
                <form action={suspendUserAction} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="userId" value={id} />
                  <div className="flex-1 min-w-48">
                    <label className="mb-1.5 block text-xs font-medium text-slate-600">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <input name="reason" required placeholder="Why is this account being suspended?" maxLength={500}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  </div>
                  <button type="submit" className={btn.danger}>Suspend account</button>
                </form>
              </div>
            )}
          </Card>
        )}

        {/* Recent audit */}
        {user.recentAudit.length > 0 && (
          <Card title="Recent Activity" note="Last 10 admin actions on this account.">
            <div className="divide-y divide-slate-100">
              {user.recentAudit.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <Badge tone={ACTION_TONE[a.action] ?? "gray"}>{a.action.replace(/_/g, " ")}</Badge>
                    <span className="text-xs text-slate-500">by {a.adminName}</span>
                  </div>
                  <span className="text-xs text-slate-400">{fmt(a.created_at)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <Link href={`/admin/audit?user=${id}`} className="text-xs text-slate-500 hover:text-slate-700">Full audit log →</Link>
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
