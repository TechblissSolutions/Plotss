import { requireAdmin } from "@/lib/auth";
import { adminBrokers, adminClients, adminUsers } from "@/lib/db/admin";
import { changeRole, verifyBroker } from "../actions";
import { Badge, btn, Card, EmptyState, PageHeader } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users & brokers" };

const ROLE_TONE = { admin: "red", broker: "blue", seller: "amber", buyer: "gray" } as const;
const th = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600";

export default async function UsersPage() {
  await requireAdmin();
  const [users, brokers, clients] = await Promise.all([adminUsers(), adminBrokers(), adminClients()]);
  return (
    <main className="mx-auto max-w-5xl">
      <PageHeader title="Users & brokers" subtitle="Change what each person can do. Only give the admin role to people you fully trust." />

      <Card title={`Users (${users.length})`} note="Set a role of “broker” and pick a client to let that person manage only that client's listings. See Clients to add a client first.">
        {users.length === 0 ? <EmptyState title="No users yet">People appear here after they sign in for the first time.</EmptyState> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">All users with their role</caption>
              <thead className="border-y border-slate-200 bg-slate-50"><tr><th scope="col" className={th}>Person</th><th scope="col" className={th}>Joined</th><th scope="col" className={th}>Current role</th><th scope="col" className={th}>Change role</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const who = u.name || u.email || u.phone || "Unnamed";
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3"><div className="font-medium text-slate-900">{u.name || "Name not set"}</div><div className="text-xs text-slate-600">{u.email || u.phone}</div></td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-700">{new Date(u.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3">
                        <Badge tone={ROLE_TONE[u.role as keyof typeof ROLE_TONE] ?? "gray"}>{u.role}</Badge>
                        {u.role === "broker" && u.brokerId && (
                          <div className="mt-1 text-xs text-slate-500">{clients.find((c) => c.id === u.brokerId)?.name ?? "Unknown client"}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <form action={changeRole} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="id" value={u.id} />
                          <select name="role" defaultValue={u.role} aria-label={`Role for ${who}`} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
                            {["buyer", "seller", "broker", "admin"].map((r) => <option key={r}>{r}</option>)}
                          </select>
                          <select name="brokerId" defaultValue={u.brokerId ?? ""} aria-label={`Client for ${who}`} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm">
                            <option value="">— no client —</option>
                            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.firmName ? ` (${c.firmName})` : ""}</option>)}
                          </select>
                          <button type="submit" className={btn.small} aria-label={`Save role for ${who}`}>Save</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Card title="Broker verification" note="A broker’s public profile and Verified badge appear only after you check their RERA or agency proof.">
          {brokers.length === 0 ? <EmptyState title="No brokers yet">Broker sign-ups will appear here once broker features are switched on.</EmptyState> : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Brokers and their verification status</caption>
                <thead className="border-y border-slate-200 bg-slate-50"><tr><th scope="col" className={th}>Broker</th><th scope="col" className={th}>RERA no.</th><th scope="col" className={th}>Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {brokers.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3"><div className="font-medium text-slate-900">{b.name}</div><div className="text-xs text-slate-600">{b.firm_name}</div></td>
                      <td className="px-4 py-3 text-slate-700">{b.rera_number || "Not given"}</td>
                      <td className="px-4 py-3">
                        <form action={verifyBroker} className="flex items-center gap-3">
                          <input type="hidden" name="id" value={b.id} />
                          <input type="hidden" name="verified" value={String(!b.verified)} />
                          <Badge tone={b.verified ? "green" : "gray"}>{b.verified ? "Verified" : "Unverified"}</Badge>
                          <button type="submit" className={btn.small} aria-label={`${b.verified ? "Revoke" : "Verify"} ${b.name}`}>{b.verified ? "Revoke" : "Verify"}</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
