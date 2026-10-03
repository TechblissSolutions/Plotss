'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { markListingSold } from '@/app/(app)/actions';
import type { SellerListing } from '@/lib/db/dashboards';
import type { Lead } from '@/lib/db/contacts';
import { slaStatus } from '@/lib/sla';
import { LeadsInbox } from './LeadsInbox';

const card = 'bg-white rounded-md border border-line p-5';
const chip = 'text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm font-tabular';
const STATUS_CHIP: Record<string, string> = {
  live: 'paint-moss text-ivory', pending: 'bg-sand text-graphite', draft: 'bg-sand text-stone', sold: 'paint-graphite text-ivory', rejected: 'paint-clay text-ivory',
};
const STATUS_LABEL: Record<string, string> = { live: 'Live', pending: 'Under review', draft: 'Draft', sold: 'Sold', rejected: 'Not approved' };
const STATUS_HELP: Record<string, string> = {
  live: 'Visible to buyers on the site.',
  pending: 'Our team is checking it. It goes live once approved.',
  draft: 'Saved but not submitted yet.',
  sold: 'Marked as sold. It is hidden from search.',
  rejected: 'This listing was not approved.',
};

function Stat({ label, value, note, highlight }: { label: string; value: React.ReactNode; note?: string; highlight?: boolean }) {
  return (
    <div className={`${card} ${highlight ? 'border-clay' : ''}`}>
      <div className="font-tabular text-[11px] font-bold uppercase tracking-wider text-stone">{label}</div>
      <div className="mt-1 font-tabular text-3xl font-black">{value}</div>
      {note && <div className="mt-1 text-xs text-stone">{note}</div>}
    </div>
  );
}

function Funnel({ l }: { l: SellerListing }) {
  const steps: [string, number][] = [['Views', l.viewsCount], ['Saved', l.saves], ['Contacts unlocked', l.unlocks], ['Enquiries', l.enquiries]];
  const max = Math.max(1, l.viewsCount);
  return (
    <ul className="space-y-1.5" aria-label="How buyers respond to this listing">
      {steps.map(([label, n]) => (
        <li key={label} className="text-xs">
          <div className="flex justify-between"><span className="text-stone">{label}</span><span className="font-tabular font-bold text-graphite">{n}</span></div>
          <div className="mt-0.5 h-1.5 rounded bg-sand"><div className="h-full rounded bg-clay" style={{ width: `${Math.min(100, (n / max) * 100)}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Quality({ l }: { l: SellerListing }) {
  const { score, tips } = l.quality;
  const tone = score >= 80 ? 'bg-moss' : score >= 50 ? 'bg-signal' : 'bg-clay';
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-stone">Listing quality</span>
        <span className="font-tabular text-base font-black text-graphite">{score}<span className="text-xs font-medium text-stone">/100</span></span>
      </div>
      <div className="mt-1 h-2 rounded bg-sand" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100} aria-label="Listing quality score">
        <div className={`h-full rounded ${tone}`} style={{ width: `${score}%` }} />
      </div>
      {tips.length > 0 ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-stone">{tips.slice(0, 3).map((t) => <li key={t}>{t}</li>)}</ul>
      ) : <p className="mt-2 text-xs text-moss">Great, this listing is complete.</p>}
    </div>
  );
}

function ListingCard({ l }: { l: SellerListing }) {
  const [pending, start] = useTransition();
  const [sold, setSold] = useState(false);
  const status = sold ? 'sold' : l.statusRaw;
  const markSold = () => {
    if (!window.confirm('Mark this listing as sold? It will be hidden from buyers.')) return;
    start(async () => { const r = await markListingSold(l.id); if (r.ok) setSold(true); });
  };
  return (
    <article className={card}>
      <div className="flex flex-col gap-4 sm:flex-row">
        {l.realImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.realImageUrl} alt="" className="h-32 w-full shrink-0 rounded object-cover sm:w-44" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${chip} ${STATUS_CHIP[status] ?? 'bg-sand'}`}>{STATUS_LABEL[status] ?? status}</span>
            <span className="text-xs text-stone">{l.city} · {l.priceDisplay}</span>
          </div>
          <h4 className="font-serif-headline mt-1 text-lg font-bold leading-snug">{l.title}</h4>
          <p className="mt-1 text-sm text-stone">
            {STATUS_HELP[status] ?? ''}
            {status === 'pending' && (() => {
              const sla = slaStatus(l.createdAt);
              return sla.overdue
                ? <span className="font-semibold text-clay"> This is past our usual review time — we&apos;ll get to it shortly.</span>
                : <span> About {sla.businessDaysLeft} business day{sla.businessDaysLeft === 1 ? '' : 's'} left on our review window.</span>;
            })()}
          </p>
          {status === 'rejected' && l.reviewNote && (
            <p className="mt-2 rounded-sm border border-clay bg-sand p-2.5 text-sm text-graphite"><b>Reason:</b> {l.reviewNote}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {status === 'live' && <Link href={`/listing/${l.slug}`} target="_blank" className="paint-graphite rounded-sm px-3 py-2 text-xs font-bold text-ivory">View live ↗</Link>}
            {status !== 'sold' && <Link href={`/dashboard/edit/${l.id}`} className="rounded-sm border border-line px-3 py-2 text-xs font-bold text-graphite hover:border-graphite">Edit</Link>}
            {status === 'live' && <button onClick={markSold} disabled={pending} className="rounded-sm border border-line px-3 py-2 text-xs font-bold text-graphite hover:border-graphite disabled:opacity-50">{pending ? 'Saving…' : 'Mark as sold'}</button>}
            {status === 'rejected' && <Link href={`/dashboard/edit/${l.id}`} className="paint-clay rounded-sm px-3 py-2 text-xs font-bold text-ivory">Fix and resubmit</Link>}
          </div>
        </div>
      </div>
      {(status === 'live' || status === 'sold') && (
        <div className="mt-5 grid gap-6 border-t border-line pt-4 md:grid-cols-2">
          <Funnel l={l} />
          <Quality l={l} />
        </div>
      )}
      {status !== 'live' && status !== 'sold' && (
        <div className="mt-5 border-t border-line pt-4"><Quality l={l} /></div>
      )}
    </article>
  );
}

export function SellerDashboard({ listings, leads }: { listings: SellerListing[]; leads: Lead[] }) {
  const live = listings.filter((l) => l.statusRaw === 'live');
  const newLeads = leads.filter((l) => l.status === 'open').length;
  const rejected = listings.filter((l) => l.statusRaw === 'rejected');
  const inReview = listings.filter((l) => l.statusRaw === 'pending').length;
  const attention = newLeads > 0 || rejected.length > 0;

  if (!listings.length) {
    return (
      <div className={`${card} py-12 text-center`}>
        <h3 className="font-serif-headline text-2xl font-bold">List your first piece of land</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-stone">It takes about 5 minutes and it is free. We check every listing before buyers see it. Have the location, size and price ready.</p>
        <Link href="/post-listing" className="paint-clay mt-5 inline-block rounded-sm px-6 py-3 text-sm font-bold text-ivory">Post a listing</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Live listings" value={live.length} note={inReview ? `${inReview} waiting for review` : undefined} />
        <Stat label="Total views" value={listings.reduce((a, l) => a + l.viewsCount, 0)} />
        <Stat label="New leads" value={newLeads} note="Not contacted yet" highlight={newLeads > 0} />
        <Stat label="All leads" value={leads.length} />
      </div>

      {attention && (
        <section aria-label="Needs your attention" className="rounded-md border border-clay bg-white p-5">
          <h3 className="font-serif-headline text-lg font-bold">Needs your attention</h3>
          <ul className="mt-2 space-y-1.5 text-sm">
            {newLeads > 0 && <li>{newLeads} buyer{newLeads === 1 ? '' : 's'} waiting for a reply. <a href="#leads" className="font-semibold text-clay underline">Reply now</a></li>}
            {rejected.map((l) => <li key={l.id}>&ldquo;{l.title}&rdquo; was not approved{l.reviewNote ? `: ${l.reviewNote}` : '.'}</li>)}
          </ul>
        </section>
      )}

      <section aria-label="My listings">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif-headline text-xl font-bold">My listings</h3>
          <Link href="/post-listing" className="paint-clay rounded-sm px-4 py-2 text-xs font-semibold text-ivory">+ Post listing</Link>
        </div>
        <div className="space-y-4">{listings.map((l) => <ListingCard key={l.id} l={l} />)}</div>
      </section>

      <section id="leads" aria-label="Leads" className={`${card} scroll-mt-20`}>
        <h3 className="font-serif-headline mb-4 border-b border-line pb-3 text-xl font-bold">Leads</h3>
        <LeadsInbox leads={leads} />
      </section>
    </div>
  );
}
