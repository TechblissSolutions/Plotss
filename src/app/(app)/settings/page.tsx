import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { selfAddCapabilityAction, selfRemoveCapabilityAction, deleteAccountAction } from "../self-actions";

export const metadata = { title: "Account settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await getSession();
  if (!s) redirect("/?login=1");

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif-headline text-2xl font-bold text-graphite">Account settings</h1>
      <p className="mt-1 text-sm text-stone">Manage your profile and marketplace access.</p>

      {/* Profile summary */}
      <section className="mt-8 rounded-xl border border-line bg-white p-6">
        <h2 className="text-sm font-semibold text-graphite">Profile</h2>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full paint-graphite text-sm font-bold text-ivory">
            {(s.name || "U")[0].toUpperCase()}
          </span>
          <div>
            <div className="text-sm font-medium text-graphite">{s.name}</div>
            {s.phone && <div className="text-xs text-stone">{s.phone}</div>}
          </div>
        </div>
      </section>

      {/* Marketplace capabilities */}
      <section className="mt-4 rounded-xl border border-line bg-white p-6">
        <h2 className="text-sm font-semibold text-graphite">Marketplace capabilities</h2>
        <p className="mt-1 text-xs text-stone">Control what you can do on PLOTSS.</p>

        <div className="mt-4 divide-y divide-line">
          {/* can_sell */}
          <div className="flex items-center justify-between py-4">
            <div>
              <div className="text-sm font-medium text-graphite">Seller access</div>
              <div className="mt-0.5 text-xs text-stone">Post and manage land listings.</div>
            </div>
            {s.canSell ? (
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Active</span>
                {!s.isAdmin && (
                  <form action={async () => { "use server"; await selfRemoveCapabilityAction("can_sell"); }}>
                    <button type="submit" className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50">
                      Disable
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <form action={async () => { "use server"; await selfAddCapabilityAction("can_sell"); }}>
                <button type="submit" className="rounded-md border border-line bg-graphite px-3 py-1.5 text-xs font-medium text-ivory transition hover:bg-graphite/90">
                  Enable seller access
                </button>
              </form>
            )}
          </div>

          {/* is_broker_staff */}
          <div className="flex items-start justify-between py-4">
            <div>
              <div className="text-sm font-medium text-graphite">Broker / agent access</div>
              <div className="mt-0.5 text-xs text-stone">Manage listings and leads for a real-estate business.</div>
            </div>
            {s.isBrokerStaff ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Active</span>
                {s.brokerId && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                    ID: {s.brokerId.slice(0, 8)}…
                  </span>
                )}
              </div>
            ) : (
              <div className="max-w-xs text-right">
                <span className="text-xs text-stone">Contact support or your agency admin to enable broker access.</span>
              </div>
            )}
          </div>
        </div>
      </section>
      {/* Danger zone — account deletion (DPDP right-to-erasure) */}
      <section className="mt-4 rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
        <p className="mt-1 text-xs text-stone">
          Permanently delete your account and all associated data. This action is irreversible.
        </p>
        <DeleteAccountSection />
      </section>
    </main>
  );
}

/** Client-side confirmation step for account deletion — inline, no modal. */
function DeleteAccountSection() {
  return (
    <div className="mt-4">
      <details className="group">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-red-300 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50 [&::-webkit-details-marker]:hidden">
          Delete my account
        </summary>
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-semibold text-red-800">Are you sure?</p>
          <p className="mt-1 text-xs text-red-700">
            This will permanently remove your profile and access. Active listings must be removed first.
            Your data may be retained for up to 30 days for legal compliance before hard-deletion.
          </p>
          <form action={async () => { "use server"; await deleteAccountAction(); }} className="mt-3">
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
            >
              Yes, delete my account
            </button>
          </form>
        </div>
      </details>
    </div>
  );
}
