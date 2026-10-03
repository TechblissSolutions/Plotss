import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminListings, signedDocUrl } from "@/lib/db/admin";
import { formatINR } from "@/lib/format";
import { getFeatures } from "@/lib/features";
import { decideDocument, decideListing, rerunScreenAction } from "../actions";
import { Badge, btn, Card, PageHeader } from "../ui";
import { slaStatus } from "@/lib/sla";

export const dynamic = "force-dynamic";
export const metadata = { title: "Approval queue" };

const TABS = ["pending", "live", "rejected", "draft", "sold", "all"];
const TAB_LABEL: Record<string, string> = { pending: "Waiting for review", live: "Live", rejected: "Rejected", draft: "Draft", sold: "Sold", all: "All" };
const STATUS_TONE = { pending: "amber", live: "green", rejected: "red", draft: "gray", sold: "blue" } as const;

export default async function ApprovalQueue({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const status = TABS.includes(sp.status ?? "") ? sp.status! : "pending";
  const [list, features] = await Promise.all([adminListings(status), getFeatures()]);
  const links = new Map<string, string>();
  await Promise.all(list.flatMap((p) => p.docs).filter((d) => d.file).map(async (d) => { const u = await signedDocUrl(d.file!); if (u) links.set(d.id, u); }));

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <PageHeader title="Approval queue" subtitle="Read each new listing, check the AI risk flags, then publish or reject. Nothing goes live until you publish it." />

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link key={t} href={`/admin/listings?status=${t}`}
            className={`rounded-full px-3.5 py-1.5 text-sm transition ${t === status ? "bg-slate-900 font-medium text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
            {TAB_LABEL[t]}
          </Link>
        ))}
      </div>

      {list.length === 0 && (
        <Card><p className="py-10 text-center text-sm text-slate-500">Nothing here. {status === "pending" ? "You are all caught up." : "Try another tab."}</p></Card>
      )}

      {list.map((p) => (
        <Card key={p.id}>
          <div className="flex flex-col gap-5 lg:flex-row">
            <div className="lg:w-56 lg:shrink-0">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" className="aspect-[4/3] w-full rounded-lg object-cover" />
              ) : (
                <div className="grid aspect-[4/3] w-full place-items-center rounded-lg bg-slate-100 text-xs text-slate-500">No photo</div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{p.title}</h3>
                <Badge tone={STATUS_TONE[p.status as keyof typeof STATUS_TONE] ?? "gray"}>{p.status}</Badge>
                {p.is_verified && features.humanReview && <Badge tone="green">Verified</Badge>}
                {p.status === "pending" && (() => {
                  const sla = slaStatus(p.created_at);
                  return sla.overdue
                    ? <Badge tone="red">Overdue — decide today</Badge>
                    : <Badge tone={sla.businessDaysLeft <= 5 ? "amber" : "gray"}>{sla.businessDaysLeft} business day{sla.businessDaysLeft === 1 ? "" : "s"} left</Badge>;
                })()}
              </div>
              <p className="mt-1 text-sm text-slate-500">{p.city} · {p.category} · {formatINR(p.price)} · {p.views} views</p>
              <p className="text-sm text-slate-500">Owner: <span className="text-slate-800">{p.owner}</span>{p.ownerPhone && ` · ${p.ownerPhone}`}</p>
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-slate-700">{p.description || <span className="text-slate-500">No description.</span>}</p>
              {p.status === "live" && <Link href={`/listing/${p.slug}`} target="_blank" className="mt-2 inline-block text-sm text-blue-600 underline">View on site ↗</Link>}
            </div>

            <div className="w-full space-y-3 lg:w-80 lg:shrink-0">
              {features.aiScreening && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI risk screen</span>
                    {p.screen && <Badge tone={p.screen.risk >= 60 ? "red" : p.screen.risk >= 40 ? "amber" : "green"}>Risk {p.screen.risk}/100</Badge>}
                  </div>
                  {p.screen ? (
                    <>
                      <p className="text-xs text-slate-600">{p.screen.summary}</p>
                      <ul className="mt-1.5 space-y-1 text-xs">
                        {p.screen.flags.map((fl, i) => (
                          <li key={i} className={fl.level === "high" ? "text-red-700" : fl.level === "medium" ? "text-amber-700" : "text-slate-500"}>• {fl.text}</li>
                        ))}
                      </ul>
                    </>
                  ) : <p className="text-xs text-slate-500">Not screened yet.</p>}
                  <form action={rerunScreenAction} className="mt-2"><input type="hidden" name="id" value={p.id} /><button className={btn.small}>Run screen</button></form>
                </div>
              )}

              {features.collectDocuments && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</div>
                  {p.docs.length === 0 && <div className="text-xs text-slate-500">None provided</div>}
                  {p.docs.map((d) => (
                    <form key={d.id} action={decideDocument} className="mb-2 border-b border-slate-200 pb-2 last:mb-0 last:border-0 last:pb-0">
                      <input type="hidden" name="id" value={d.id} />
                      <div className="flex items-center justify-between text-sm"><span>{d.name}</span><Badge tone={d.status === "verified" ? "green" : d.status === "rejected" ? "red" : "gray"}>{d.status}</Badge></div>
                      {links.get(d.id) ? <a href={links.get(d.id)} target="_blank" rel="noopener" className="text-xs text-blue-600 underline">Open file ↗ (link expires in 10 min)</a> : <span className="text-xs text-slate-500">No file attached</span>}
                      <input name="ref" defaultValue={d.ref ?? ""} placeholder="Document reference no." className="mt-1.5 w-full rounded-md border border-slate-300 px-2 py-1 text-xs" />
                      <div className="mt-1.5 flex gap-1.5">
                        <button name="status" value="verified" className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">Verify</button>
                        <button name="status" value="rejected" className={btn.small}>Reject</button>
                        <button name="status" value="pending" className={btn.small}>Reset</button>
                      </div>
                    </form>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form action={decideListing} className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <input type="hidden" name="id" value={p.id} />
            {p.status !== "rejected" && <input name="note" aria-label={`Reason if you reject "${p.title}"`} placeholder="Reason (shown to the seller if you reject)" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm sm:max-w-xs" />}
            {p.status !== "live" && <button name="status" value="live" className={btn.success}>Publish</button>}
            {p.status === "live" && <button name="status" value="draft" className={btn.secondary}>Unpublish</button>}
            {p.status !== "rejected" && <button name="status" value="rejected" className={btn.danger}>Reject</button>}
            {p.status === "live" && <button name="status" value="sold" className={btn.secondary}>Mark sold</button>}
            <span className="text-xs text-slate-500">{features.humanReview ? "The Verified badge appears only when every document is verified." : "Staff verification is off: this listing will not show a Verified badge."}</span>
          </form>
        </Card>
      ))}
    </main>
  );
}
