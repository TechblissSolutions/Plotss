import { requireAdmin } from "@/lib/auth";
import { adminNotifications } from "@/lib/db/admin";
import { getFeatures } from "@/lib/features";
import { Badge, Card, EmptyState, PageHeader } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

const th = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600";

export default async function NotificationsPage() {
  await requireAdmin();
  const [rows, features] = await Promise.all([adminNotifications(), getFeatures()]);
  return (
    <main className="mx-auto max-w-5xl">
      <PageHeader
        title="Notifications"
        subtitle="What PLOTSS has sent people — in-app always; email/WhatsApp only if their channel is switched on below and a provider is configured."
      />

      <Card title="Channels" className="mb-6">
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge tone={features.notifyInApp ? "green" : "gray"}>In-app: {features.notifyInApp ? "On" : "Off"}</Badge>
          <Badge tone={features.notifyEmail ? "green" : "gray"}>Email: {features.notifyEmail ? "On" : "Off"}</Badge>
          <Badge tone={features.notifyWhatsapp ? "green" : "gray"}>WhatsApp/SMS: {features.notifyWhatsapp ? "On" : "Off"}</Badge>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Email needs <code className="rounded bg-slate-100 px-1">RESEND_API_KEY</code> and WhatsApp/SMS needs{" "}
          <code className="rounded bg-slate-100 px-1">MSG91_API_KEY</code> set in the environment before their toggle on{" "}
          <a href="/admin/settings" className="text-blue-600 underline">Launch settings</a> actually sends anything — this page
          only shows what was attempted, via the in-app record every notification leaves behind.
        </p>
      </Card>

      <Card title={`Recent (${rows.length})`}>
        {rows.length === 0 ? (
          <EmptyState title="No notifications yet">They will appear here as soon as something triggers one — a listing decision, a new enquiry, or a signup.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Recent notifications sent to users</caption>
              <thead className="border-y border-slate-200 bg-slate-50">
                <tr>
                  <th scope="col" className={th}>When</th>
                  <th scope="col" className={th}>To</th>
                  <th scope="col" className={th}>Title</th>
                  <th scope="col" className={th}>Message</th>
                  <th scope="col" className={th}>Read</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-700">{new Date(n.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-4 py-3 text-slate-800">{n.recipient}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{n.title}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">{n.body}</td>
                    <td className="px-4 py-3"><Badge tone={n.read ? "gray" : "amber"}>{n.read ? "Read" : "Unread"}</Badge></td>
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
