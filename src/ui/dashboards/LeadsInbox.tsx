'use client';
import React, { useState, useTransition } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import { setLeadStatus } from '@/app/(app)/actions';
import type { Lead } from '@/lib/db/contacts';
import { timeAgo } from '@/lib/time';

export const LEAD_LABEL: Record<string, string> = { open: 'New', contacted: 'Contacted', visit: 'Site visit', closed: 'Closed' };
const FILTERS = ['open', 'contacted', 'visit', 'closed', 'all'] as const;

const waLink = (phone: string, listing: string) => {
  const d = phone.replace(/\D/g, '');
  if (!d) return '';
  return `https://wa.me/${d.length === 10 ? '91' + d : d}?text=${encodeURIComponent(`Hello, thank you for your interest in "${listing}" on PLOTSS.`)}`;
};

/** Enquiries and unlocks on a seller's listings, newest first, with one-tap call and WhatsApp. */
export function LeadsInbox({ leads }: { leads: Lead[] }) {
  const [rows, setRows] = useState(leads);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(leads.some((l) => l.status === 'open') ? 'open' : 'all');
  const [, start] = useTransition();
  const change = (id: string, status: string) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    start(async () => { await setLeadStatus(id, status); });
  };
  const count = (f: string) => (f === 'all' ? rows.length : rows.filter((r) => r.status === f).length);
  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);

  if (!rows.length) {
    return (
      <div className="py-10 text-center">
        <p className="font-semibold text-graphite">No leads yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-stone">A lead appears here when a buyer unlocks your contact or sends an enquiry. Listings with photos, a map pin and a full description get more leads.</p>
      </div>
    );
  }
  return (
    <div>
      <div role="tablist" aria-label="Filter leads" className="flex flex-wrap gap-2 pb-4">
        {FILTERS.map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === f ? 'paint-graphite border-graphite text-ivory' : 'border-line bg-white text-graphite hover:border-graphite'}`}>
            {f === 'all' ? 'All' : LEAD_LABEL[f]} <span className="opacity-70">({count(f)})</span>
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="py-6 text-center text-sm text-stone">Nothing in this group.</p>}
      <ul className="space-y-3">
        {shown.map((l) => {
          const wa = waLink(l.buyerPhone, l.listingTitle);
          return (
            <li key={l.id} className={`rounded-md border p-4 ${l.status === 'open' ? 'border-clay bg-white' : 'border-line bg-white'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-graphite">{l.buyerName}</span>
                    {l.status === 'open' && <span className="rounded-sm bg-clay px-1.5 py-0.5 text-[11px] font-bold uppercase text-ivory">New</span>}
                    <span className="text-xs text-stone">{timeAgo(l.at)}</span>
                  </div>
                  <div className="mt-0.5 break-words text-sm text-stone">{l.kind === 'unlock' ? 'Unlocked your contact' : 'Sent an enquiry'} on <span className="text-graphite">{l.listingTitle}</span>{l.visitDate ? ` · wants to visit ${l.visitDate}` : ''}</div>
                  {l.kind === 'enquiry' && l.message && <p className="mt-2 whitespace-pre-line rounded-sm bg-sand p-2.5 text-sm text-graphite">{l.message}</p>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {l.buyerPhone && (
                    <a href={`tel:${l.buyerPhone}`} className="paint-graphite inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-xs font-bold text-ivory"><Phone className="h-3.5 w-3.5" aria-hidden />Call<span className="sr-only"> {l.buyerName}</span></a>
                  )}
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="paint-moss inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-xs font-bold text-ivory"><MessageCircle className="h-3.5 w-3.5" aria-hidden />WhatsApp<span className="sr-only"> {l.buyerName}</span></a>
                  )}
                  <label className="text-xs text-stone">
                    <span className="sr-only">Status for {l.buyerName}</span>
                    <select value={l.status} onChange={(e) => change(l.id, e.target.value)} className="rounded-sm border border-line bg-white px-2 py-2 text-xs font-semibold text-graphite">
                      {Object.entries(LEAD_LABEL).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
