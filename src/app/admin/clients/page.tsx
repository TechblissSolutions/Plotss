import { requireAdmin } from "@/lib/auth";
import { adminClients } from "@/lib/db/admin";
import { createClientAction, setClientStatusAction } from "../actions";
import { Badge, btn, Card, EmptyState, input, label, PageHeader } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients" };

const th = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600";

export default async function ClientsPage() {
  await requireAdmin();
  const clients = await adminClients();
  return (
    <main className="mx-auto max-w-5xl">
      <PageHeader
        title="Clients"
        subtitle="Each client is a business account on the shared PLOTSS marketplace (an agency, builder or broker). Suspending a client hides their listings from buyers without deleting any data."
      />

      <Card title="Add a client" className="mb-6">
        <form action={createClientAction} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className={label} htmlFor="client-name">Contact name</label>
            <input id="client-name" name="name" required className={input} placeholder="e.g. Rohan Mehta" />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className={label} htmlFor="client-firm">Business / firm name</label>
            <input id="client-firm" name="firmName" className={input} placeholder="e.g. Mehta Land Ventures" />
          </div>
          <button type="submit" className={btn.primary}>Add client</button>
        </form>
      </Card>

      <Card title={`Clients (${clients.length})`}>
        {clients.length === 0 ? (
          <EmptyState title="No clients yet">Add a client above, then invite their staff to sign in and set their role to “broker” with this client under Users.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Clients with listing counts and status</caption>
              <thead className="border-y border-slate-200 bg-slate-50">
                <tr>
                  <th scope="col" className={th}>Client</th>
                  <th scope="col" className={th}>Staff</th>
                  <th scope="col" className={th}>Listings</th>
                  <th scope="col" className={th}>Verified</th>
                  <th scope="col" className={th}>Status</th>
                  <th scope="col" className={th}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3"><div className="font-medium text-slate-900">{c.name}</div><div className="text-xs text-slate-600">{c.firmName || "—"}</div></td>
                    <td className="px-4 py-3 text-slate-700">{c.staffCount}</td>
                    <td className="px-4 py-3 text-slate-700">{c.listingCount}</td>
                    <td className="px-4 py-3"><Badge tone={c.verified ? "green" : "gray"}>{c.verified ? "Verified" : "Unverified"}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={c.status === "active" ? "green" : "red"}>{c.status === "active" ? "Active" : "Suspended"}</Badge></td>
                    <td className="px-4 py-3">
                      <form action={setClientStatusAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value={c.status === "active" ? "suspended" : "active"} />
                        <button type="submit" className={btn.small} aria-label={`${c.status === "active" ? "Suspend" : "Reactivate"} ${c.name}`}>
                          {c.status === "active" ? "Suspend" : "Reactivate"}
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </main>
  );
}
