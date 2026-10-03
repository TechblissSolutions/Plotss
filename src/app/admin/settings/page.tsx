import { requireAdmin } from "@/lib/auth";
import { getCities } from "@/lib/db/cities";
import { getFeatures } from "@/lib/features";
import { saveFeaturesAction, toggleCityAction } from "../actions";
import { Badge, btn, Card, EmptyState, PageHeader } from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Launch settings" };

function Toggle({ name, label, help, checked }: { name: string; label: string; help: string; checked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition hover:bg-slate-50 has-[:checked]:border-emerald-300 has-[:checked]:bg-emerald-50/50">
      <input type="checkbox" name={name} defaultChecked={checked} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-600" />
      <span>
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="mt-0.5 block text-sm text-slate-600">{help}</span>
      </span>
    </label>
  );
}

export default async function SettingsPage() {
  await requireAdmin();
  const [f, cities] = await Promise.all([getFeatures(), getCities(true)]);
  const active = cities.filter((c) => c.active);
  return (
    <main className="mx-auto max-w-4xl">
      <PageHeader title="Launch settings" subtitle="Switch features on in phases. Every change here applies to the live site right after you save." />

      <form action={saveFeaturesAction} className="space-y-6">
        <Card title="Verification" note="Suggested launch: documents off, AI screening on, staff review off.">
          <p className="mb-3 text-sm text-slate-600">
            Buyers and owners usually discuss papers after meeting offline. The public site never says &ldquo;Verified&rdquo; unless staff review is on and a person really checked the documents.
          </p>
          <div className="space-y-3">
            <Toggle name="collectDocuments" checked={f.collectDocuments} label="Collect documents from sellers and show the document checklist"
              help="Adds a Documents step to the seller form and the checklist panel on listing pages." />
            <Toggle name="aiScreening" checked={f.aiScreening} label="AI risk screen on every new listing"
              help="Checks basics, duplicates, price outliers and red-flag wording. Passing listings show an “AI-screened” label. Admins see the flags in the approval queue." />
            <Toggle name="humanReview" checked={f.humanReview} label="Staff verification (Verified badge)"
              help="Enables the Verified badge and the “Verified only” filter. Needs documents to be collected and a team to check them." />
          </div>
        </Card>

        <Card title="Brokers">
          <Toggle name="brokers" checked={f.brokers} label="Enable broker features"
            help="Shows the broker banner, menu link, broker sign-up option, profiles and dashboard. Keep off until a broker team is confirmed." />
        </Card>

        <Card title="Notifications" note="In-app works immediately. Email and WhatsApp/SMS also need a provider's API key added to the environment first — the toggle alone won't send anything until one is configured.">
          <div className="space-y-3">
            <Toggle name="notifyInApp" checked={f.notifyInApp} label="In-app notifications"
              help="Bell icon on every signed-in dashboard. No setup needed." />
            <Toggle name="notifyEmail" checked={f.notifyEmail} label="Email notifications"
              help="Listing approved/rejected, new enquiries. Needs RESEND_API_KEY (or another provider) in the environment." />
            <Toggle name="notifyWhatsapp" checked={f.notifyWhatsapp} label="WhatsApp / SMS notifications"
              help="Same events as email. Needs an SMS/WhatsApp provider's API key (e.g. MSG91) in the environment." />
          </div>
        </Card>

        <Card title="Visitor tracking" note="First-party analytics stored in your own database.">
          <div className="space-y-3">
            <Toggle name="tracking" checked={f.tracking} label="Record visitor journeys"
              help="Page views, clicks, form steps and searches. No third-party trackers." />
            <Toggle name="consentBanner" checked={f.consentBanner} label="Ask for consent before tracking"
              help="Shows a small banner. Recommended under India’s DPDP Act. If a visitor declines, nothing is recorded." />
          </div>
        </Card>

        <Card title="Limits">
          <label htmlFor="unlockLimitPerDay" className="block text-sm font-medium text-slate-800">Contact unlocks per user per day</label>
          <p id="unlock-help" className="mt-0.5 text-sm text-slate-600">Protects owners from people copying phone numbers in bulk. Between 1 and 200.</p>
          <input id="unlockLimitPerDay" aria-describedby="unlock-help" type="number" name="unlockLimitPerDay" min={1} max={200} defaultValue={f.unlockLimitPerDay}
            className="mt-2 w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm" />
        </Card>

        <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <p className="text-sm text-slate-600">Changes apply to the whole site immediately.</p>
          <button type="submit" className={btn.primary}>Save settings</button>
        </div>
      </form>

      <div className="mt-8">
        <Card title="Cities" note={`${active.length} active. Only active cities appear in search, the seller form, city pages and the sitemap.`}>
          {cities.length === 0 ? (
            <EmptyState title="No cities found">Run migration 0003 in Supabase.</EmptyState>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cities.map((c) => (
                <li key={c.slug}>
                  <form action={toggleCityAction} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <input type="hidden" name="slug" value={c.slug} />
                    <input type="hidden" name="active" value={String(!c.active)} />
                    <span className="min-w-0">
                      <span className="font-medium text-slate-900">{c.name}</span> <span className="text-slate-600">· {c.state}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <Badge tone={c.active ? "green" : "gray"}>{c.active ? "Active" : "Hidden"}</Badge>
                      <button type="submit" className={btn.small} aria-label={`${c.active ? "Hide" : "Activate"} ${c.name}`}>{c.active ? "Hide" : "Activate"}</button>
                    </span>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </main>
  );
}
