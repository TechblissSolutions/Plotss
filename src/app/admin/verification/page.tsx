import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminListings, signedDocUrl } from "@/lib/db/admin";
import { createServiceClient } from "@/lib/supabase/service";
import { formatINR } from "@/lib/format";
import { getFeatures } from "@/lib/features";
import { slaStatus } from "@/lib/sla";
import { decideDocument, decideListing, rerunScreenAction } from "../actions";
import { Badge, btn, Card, PageHeader } from "../ui";
import type { AdminListing } from "@/lib/db/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verification Center — Admin" };

/* ── helpers ── */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const fmtRelative = (iso: string) => {
  const diff = Date.now() - Date.parse(iso);
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
};

const DOC_STATUS_TONE = {
  verified: "green",
  rejected: "red",
  action_required: "amber",
  pending: "gray",
} as const;

const AUDIT_ACTION_LABELS: Record<string, string> = {
  approve_listing: "Approved",
  reject_listing: "Rejected",
  set_listing_draft: "Unpublished",
  set_listing_sold: "Marked sold",
  doc_verified: "Doc verified",
  doc_rejected: "Doc rejected",
  doc_action_required: "Info requested",
  doc_pending: "Doc reset",
};

/* ── Summary count tile ── */
function CountTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "red" | "amber" | "green" | "neutral";
}) {
  const cls =
    tone === "red" ? "border-red-200 bg-red-50 text-red-700" :
    tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-700" :
    tone === "green" ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
    "border-slate-200 bg-white text-slate-700";
  return (
    <div className={`rounded-xl border px-4 py-3 ${cls}`}>
      <div className={`text-[26px] font-semibold tracking-[-0.03em]`}>{value}</div>
      <div className="text-xs font-medium">{label}</div>
    </div>
  );
}

/* ── Queue item ── */
function QueueItem({
  listing,
  selected,
  sla,
  docProgress,
}: {
  listing: AdminListing;
  selected: boolean;
  sla: ReturnType<typeof slaStatus>;
  docProgress: { verified: number; total: number };
}) {
  const urgency = sla.overdue ? "red" : sla.businessDaysLeft <= 5 ? "amber" : "gray";
  return (
    <Link
      href={`/admin/verification?listing=${listing.id}`}
      className={`block border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        selected ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
      }`}
      aria-current={selected ? "page" : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="truncate text-sm font-medium text-slate-900">{listing.title}</span>
        <Badge tone={urgency}>
          {sla.overdue ? "Overdue" : `${sla.businessDaysLeft}d`}
        </Badge>
      </div>
      <div className="mt-0.5 truncate text-xs text-slate-500">
        {listing.city} · {listing.category}
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-xs">
        {listing.screen && (
          <span className={listing.screen.risk >= 60 ? "text-red-600 font-medium" : listing.screen.risk >= 40 ? "text-amber-600" : "text-slate-500"}>
            Risk {listing.screen.risk}
          </span>
        )}
        {docProgress.total > 0 && (
          <span className={docProgress.verified === docProgress.total ? "text-emerald-600" : "text-slate-500"}>
            {docProgress.verified}/{docProgress.total} docs
          </span>
        )}
        <span className="text-slate-400">{fmtRelative(listing.created_at)}</span>
      </div>
    </Link>
  );
}

/* ── Page ── */
export default async function VerificationCenter({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; q?: string; risk?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const selectedId = sp.listing ?? null;
  const query = (sp.q ?? "").trim().toLowerCase();
  const riskFilter = sp.risk ?? "";

  const [pending, features] = await Promise.all([
    adminListings("pending"),
    getFeatures(),
  ]);

  /* Compute SLA and doc progress for each listing */
  const enriched = pending.map((p) => {
    const sla = slaStatus(p.created_at);
    const docVerified = p.docs.filter((d) => d.status === "verified").length;
    const docTotal = p.docs.length;
    return { listing: p, sla, docProgress: { verified: docVerified, total: docTotal } };
  });

  /* Sort: overdue first, then by days left ascending */
  enriched.sort((a, b) => {
    if (a.sla.overdue !== b.sla.overdue) return a.sla.overdue ? -1 : 1;
    return a.sla.businessDaysLeft - b.sla.businessDaysLeft;
  });

  /* Summary counts */
  const overdueCount = enriched.filter((e) => e.sla.overdue).length;
  const inReviewCount = enriched.filter(
    (e) => !e.sla.overdue && e.docProgress.total > 0 && e.docProgress.verified < e.docProgress.total
  ).length;
  const awaitingCount = enriched.filter((e) => e.docProgress.total === 0).length;
  const docsReadyCount = enriched.filter(
    (e) => e.docProgress.total > 0 && e.docProgress.verified === e.docProgress.total
  ).length;

  /* Filter */
  const filtered = enriched.filter(({ listing }) => {
    if (query && !`${listing.title} ${listing.city} ${listing.category}`.toLowerCase().includes(query)) return false;
    if (riskFilter === "high" && (!listing.screen || listing.screen.risk < 60)) return false;
    if (riskFilter === "medium" && (!listing.screen || listing.screen.risk < 40 || listing.screen.risk >= 60)) return false;
    if (riskFilter === "low" && (listing.screen && listing.screen.risk >= 40)) return false;
    return true;
  });

  /* Selected listing detail */
  const selectedEntry = selectedId ? enriched.find((e) => e.listing.id === selectedId) : null;
  const selected = selectedEntry?.listing ?? null;

  /* Signed URLs and audit history for selected listing */
  const signedLinks = new Map<string, string>();
  let auditHistory: {
    id: string;
    action: string;
    created_at: string;
    admin_id: string | null;
    details: Record<string, unknown> | null;
  }[] = [];
  const adminNames = new Map<string, string>();

  if (selected) {
    await Promise.all([
      ...selected.docs.filter((d) => d.file).map(async (d) => {
        const url = await signedDocUrl(d.file!);
        if (url) signedLinks.set(d.id, url);
      }),
      (async () => {
        const svc = createServiceClient();
        const { data: rows } = await svc
          .from("admin_audit_log")
          .select("id,action,created_at,admin_id,details")
          .eq("target_id", selected.id)
          .order("created_at", { ascending: false })
          .limit(12);
        auditHistory = (rows ?? []) as typeof auditHistory;
        const adminIds = [...new Set(auditHistory.map((r) => r.admin_id).filter((id): id is string => Boolean(id)))];
        if (adminIds.length > 0) {
          const { data: profiles } = await svc.from("profiles").select("id,full_name").in("id", adminIds);
          for (const p of profiles ?? []) adminNames.set(p.id, p.full_name ?? "Admin");
        }
      })(),
    ]);
  }

  const unverifiedDocs = selected ? selected.docs.filter((d) => d.status !== "verified") : [];
  const allDocsVerified = selected ? (selected.docs.length > 0 && unverifiedDocs.length === 0) : false;

  return (
    <main className="mx-auto max-w-7xl">
      <PageHeader
        title="Verification Center"
        subtitle="Review pending listings, verify seller documents, and publish or reject with a clear audit trail."
        actions={
          <Link href="/admin/listings" className={btn.secondary}>
            Full listing queue ↗
          </Link>
        }
      />

      {/* Summary strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CountTile label="Overdue" value={overdueCount} tone={overdueCount > 0 ? "red" : "neutral"} />
        <CountTile label="Awaiting start" value={awaitingCount} tone={awaitingCount > 0 ? "amber" : "neutral"} />
        <CountTile label="In review" value={inReviewCount} tone="neutral" />
        <CountTile label="Docs ready" value={docsReadyCount} tone={docsReadyCount > 0 ? "green" : "neutral"} />
      </div>

      {/* Main split layout */}
      <div className="grid items-start gap-5 lg:grid-cols-3">

        {/* ── Queue ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
          {/* Search + filter */}
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="mb-2.5 text-sm font-semibold text-slate-900">
              Pending queue
              <span className="ml-1.5 text-xs font-normal text-slate-500">({filtered.length} shown)</span>
            </div>
            <form method="GET" action="/admin/verification">
              <input
                name="listing"
                type="hidden"
                value={selectedId ?? ""}
              />
              <input
                name="q"
                type="search"
                defaultValue={sp.q ?? ""}
                placeholder="Search by title, city…"
                aria-label="Search pending listings"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:bg-white"
              />
              <div className="mt-2 flex gap-1.5 text-xs">
                {[
                  { value: "", label: "All" },
                  { value: "high", label: "High risk" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low risk" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="submit"
                    name="risk"
                    value={opt.value}
                    className={`rounded-full px-2.5 py-1 transition-colors ${
                      riskFilter === opt.value
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Queue list */}
          <div className="max-h-[calc(100vh-360px)] min-h-[200px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-500">
                {pending.length === 0
                  ? "Nothing pending — you're all caught up."
                  : "No listings match the current filter."}
              </div>
            ) : (
              filtered.map(({ listing, sla, docProgress }) => (
                <QueueItem
                  key={listing.id}
                  listing={listing}
                  selected={listing.id === selectedId}
                  sla={sla}
                  docProgress={docProgress}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Detail workspace ── */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
              <div className="text-center">
                <div className="text-sm font-medium text-slate-700">Select a listing to review</div>
                <div className="mt-1 text-xs text-slate-500">
                  {pending.length > 0
                    ? `${pending.length} listing${pending.length === 1 ? "" : "s"} awaiting review`
                    : "The queue is empty — no listings pending review."}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Listing header */}
              <Card>
                <div className="flex flex-col gap-5 sm:flex-row">
                  {selected.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.image}
                      alt=""
                      className="aspect-[4/3] w-full rounded-xl object-cover sm:w-48 sm:shrink-0"
                    />
                  ) : (
                    <div className="grid aspect-[4/3] w-full place-items-center rounded-xl bg-slate-100 text-xs text-slate-500 sm:w-48 sm:shrink-0">
                      No photo
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">{selected.title}</h2>
                      <Badge tone="amber">pending</Badge>
                      {features.humanReview && selected.is_verified && <Badge tone="green">Verified</Badge>}
                      {(() => {
                        const sla = selectedEntry!.sla;
                        return sla.overdue
                          ? <Badge tone="red">Overdue</Badge>
                          : <Badge tone={sla.businessDaysLeft <= 5 ? "amber" : "gray"}>{sla.businessDaysLeft} days left</Badge>;
                      })()}
                    </div>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
                      <div><dt className="inline text-slate-400">City: </dt><dd className="inline">{selected.city}</dd></div>
                      <div><dt className="inline text-slate-400">Category: </dt><dd className="inline">{selected.category}</dd></div>
                      <div><dt className="inline text-slate-400">Price: </dt><dd className="inline">{formatINR(selected.price)}</dd></div>
                      <div><dt className="inline text-slate-400">Submitted: </dt><dd className="inline">{fmtDate(selected.created_at)}</dd></div>
                      <div><dt className="inline text-slate-400">Owner: </dt><dd className="inline">{selected.owner}</dd></div>
                      {selected.ownerPhone && <div><dt className="inline text-slate-400">Phone: </dt><dd className="inline">{selected.ownerPhone}</dd></div>}
                    </dl>
                    {selected.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-700">{selected.description}</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* AI risk screen */}
              {features.aiScreening && (
                <Card title="AI risk screen" note="Decision support only — does not substitute for document review">
                  {selected.screen ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge tone={selected.screen.risk >= 60 ? "red" : selected.screen.risk >= 40 ? "amber" : "green"}>
                          Risk score {selected.screen.risk}/100
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Screened {fmtRelative(selected.screen.at)} via {selected.screen.source}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{selected.screen.summary}</p>
                      {selected.screen.flags.length > 0 && (
                        <ul className="space-y-1 text-xs">
                          {selected.screen.flags.map((fl, i) => (
                            <li key={i} className={fl.level === "high" ? "text-red-700" : fl.level === "medium" ? "text-amber-700" : "text-slate-500"}>
                              • {fl.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">Not screened yet.</p>
                      <form action={rerunScreenAction}>
                        <input type="hidden" name="id" value={selected.id} />
                        <button className={btn.small}>Run screen</button>
                      </form>
                    </div>
                  )}
                  {selected.screen && (
                    <form action={rerunScreenAction} className="mt-3 border-t border-slate-100 pt-3">
                      <input type="hidden" name="id" value={selected.id} />
                      <button className={btn.small}>Re-run screen</button>
                    </form>
                  )}
                </Card>
              )}

              {/* Document checklist */}
              {features.collectDocuments && (
                <Card
                  title="Document checklist"
                  note={
                    selected.docs.length === 0
                      ? "No documents submitted"
                      : `${selectedEntry!.docProgress.verified}/${selectedEntry!.docProgress.total} verified`
                  }
                >
                  {selected.docs.length === 0 ? (
                    <p className="py-4 text-sm text-slate-500">
                      The seller has not submitted any documents. You may still approve the listing — the Verified badge will not appear.
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {selected.docs.map((doc) => (
                        <li key={doc.id} className="py-4 first:pt-0 last:pb-0">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-sm font-medium text-slate-900">{doc.name || "Document"}</span>
                            <Badge tone={DOC_STATUS_TONE[doc.status as keyof typeof DOC_STATUS_TONE] ?? "gray"}>
                              {doc.status.replace("_", " ")}
                            </Badge>
                          </div>

                          {signedLinks.get(doc.id) ? (
                            <a
                              href={signedLinks.get(doc.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-xs font-medium text-blue-600 hover:underline"
                            >
                              Open file ↗ <span className="text-slate-400">(link expires in 10 min)</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">No file attached</span>
                          )}

                          {doc.ref && (
                            <div className="mt-1 text-xs text-slate-500">
                              Ref / note: <span className="font-mono">{doc.ref}</span>
                            </div>
                          )}

                          <form action={decideDocument} className="mt-3">
                            <input type="hidden" name="id" value={doc.id} />
                            <input type="hidden" name="listing" value={selected.id} />
                            <label className="mb-1.5 block text-xs text-slate-500" htmlFor={`ref-${doc.id}`}>
                              Reference number / rejection reason
                            </label>
                            <input
                              id={`ref-${doc.id}`}
                              name="ref"
                              defaultValue={doc.ref ?? ""}
                              placeholder="Doc reference no. or reason"
                              className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs focus:border-blue-400 focus:outline-none"
                            />
                            <div className="flex flex-wrap gap-2">
                              <button
                                name="status"
                                value="verified"
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
                              >
                                Verify
                              </button>
                              <button
                                name="status"
                                value="rejected"
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 active:scale-[0.98]"
                              >
                                Reject
                              </button>
                              <button
                                name="status"
                                value="action_required"
                                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 active:scale-[0.98]"
                              >
                                Request info
                              </button>
                              {doc.status !== "pending" && (
                                <button
                                  name="status"
                                  value="pending"
                                  className={btn.small}
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              )}

              {/* Listing decision */}
              <Card title="Listing decision">
                {/* Unverified docs warning */}
                {features.humanReview && selected.docs.length > 0 && !allDocsVerified && (
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-400 text-[10px] font-bold text-white">!</span>
                    <p className="text-sm text-amber-900">
                      <span className="font-medium">{unverifiedDocs.length} document{unverifiedDocs.length === 1 ? "" : "s"} not yet verified.</span>{" "}
                      The listing can still be published, but the <strong>Verified badge</strong> will not appear until all documents are verified.
                    </p>
                  </div>
                )}

                {!features.humanReview && (
                  <p className="mb-4 text-xs text-slate-500">
                    Staff verification is off — the Verified badge feature is disabled. Listings can be approved without document review.
                  </p>
                )}

                {/* Reject form */}
                <form action={decideListing} className="space-y-3">
                  <input type="hidden" name="id" value={selected.id} />
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-600" htmlFor={`note-${selected.id}`}>
                      Rejection reason <span className="font-normal text-slate-400">(shown to the seller)</span>
                    </label>
                    <input
                      id={`note-${selected.id}`}
                      name="note"
                      placeholder="Explain why the listing is being rejected…"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      name="status"
                      value="rejected"
                      className={btn.danger}
                    >
                      Reject listing
                    </button>
                    <button name="status" value="draft" className={btn.secondary}>
                      Return to draft
                    </button>
                  </div>
                </form>

                {/* Approve — two-step via details/summary */}
                <details className="mt-4 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50">
                  <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
                    Publish listing… ▸
                  </summary>
                  <div className="border-t border-emerald-200 px-4 py-4">
                    <p className="mb-3 text-sm text-emerald-900">
                      This will make the listing <strong>publicly visible</strong> on the site.
                      {features.humanReview && !allDocsVerified && selected.docs.length > 0 && (
                        <> The Verified badge will not appear until all documents are verified.</>
                      )}
                    </p>
                    <form action={decideListing}>
                      <input type="hidden" name="id" value={selected.id} />
                      <button name="status" value="live" className={btn.success}>
                        Confirm — publish now
                      </button>
                    </form>
                  </div>
                </details>
              </Card>

              {/* Review history */}
              {auditHistory.length > 0 && (
                <Card title="Review history" note="All admin actions on this listing">
                  <ol className="space-y-2.5">
                    {auditHistory.map((row) => (
                      <li key={row.id} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 shrink-0 text-xs text-slate-400 tabular-nums">
                          {fmtDate(row.created_at)}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="font-medium text-slate-800">
                            {AUDIT_ACTION_LABELS[row.action] ?? row.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-slate-500">
                            {" "}by {adminNames.get(row.admin_id ?? "") ?? "Admin"}
                          </span>
                          {(() => {
                            const d = row.details as Record<string, unknown> | null;
                            const note = d?.note ? String(d.note) : null;
                            const ref = d?.ref ? String(d.ref) : null;
                            return (
                              <>
                                {note && <span className="block text-xs text-slate-500 mt-0.5">Note: {note}</span>}
                                {ref && <span className="block text-xs text-slate-500 mt-0.5">Ref: {ref}</span>}
                              </>
                            );
                          })()}
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
