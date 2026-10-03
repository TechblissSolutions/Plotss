'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { inviteStaffAction, saveBrokerProfile } from '@/app/(app)/actions';
import { slaStatus } from '@/lib/sla';
import { LEAD_LABEL, LeadsInbox } from './LeadsInbox';
import type { Lead } from '@/lib/db/contacts';
import type { Listing } from '../types';

const card = 'bg-white rounded-md border border-line p-5';
const chip = 'text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm font-tabular';
const STATUS: Record<string, string> = {
  live: 'paint-moss text-ivory', pending: 'bg-sand text-graphite', draft: 'bg-sand text-stone', sold: 'paint-graphite text-ivory', rejected: 'paint-clay text-ivory',
};

function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className={card}>
      <div className="text-[11px] uppercase tracking-wider font-bold text-stone font-tabular">{label}</div>
      <div className="text-3xl font-black font-tabular mt-1">{value}</div>
      {note && <div className="text-[11px] text-stone mt-1">{note}</div>}
    </div>
  );
}

function ListingRow({ l }: { l: Listing }) {
  return (
    <div className="py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        {l.realImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.realImageUrl} alt="" className="w-20 h-14 rounded object-cover shrink-0" />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`${chip} ${STATUS[l.status] ?? 'bg-sand'}`}>{l.status === 'pending' ? 'Under review' : l.status}</span>
            <h4 className="font-serif-headline text-base font-bold truncate">{l.title}</h4>
          </div>
          <div className="text-xs text-stone font-tabular mt-1">{l.priceDisplay} • {l.city}</div>
          {l.status === 'pending' && (() => {
            const sla = slaStatus(l.createdAt);
            return (
              <div className={`text-[11px] mt-0.5 ${sla.overdue ? 'text-clay font-semibold' : 'text-stone'}`}>
                {sla.overdue ? 'Past our usual review time' : `${sla.businessDaysLeft} business day${sla.businessDaysLeft === 1 ? '' : 's'} left for review`}
              </div>
            );
          })()}
        </div>
      </div>
      <div className="flex items-center gap-6 text-xs font-tabular">
        <div><span className="text-stone block text-[11px] uppercase">Views</span><b className="text-base">{l.viewsCount}</b></div>
        <div><span className="text-stone block text-[11px] uppercase">Leads</span><b className="text-base text-clay">{l.enquiriesCount}</b></div>
        {l.status === 'live' && <Link href={`/listing/${l.slug}`} target="_blank" className="paint-graphite text-ivory px-3 py-1.5 rounded-sm">View live ↗</Link>}
      </div>
    </div>
  );
}

/* ------------------------------ BROKER ------------------------------ */
type BrokerProfile = { id: string; name: string; firm_name: string | null; rera_number: string | null; verified: boolean } | null;

function InviteTeammate() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pending, start] = useTransition();
  const submit = () => start(async () => {
    const r = await inviteStaffAction((() => { const f = new FormData(); f.set('email', email); return f; })());
    setMsg(r.ok ? { kind: 'ok', text: `Invited ${email}. They can sign in to manage your listings.` } : { kind: 'err', text: r.error });
    if (r.ok) setEmail('');
  });
  return (
    <section className={card}>
      <h3 className="font-serif-headline text-lg font-bold">Invite a teammate</h3>
      <p className="mt-1 text-sm text-stone">They'll be able to manage every listing and lead for this business, same as you.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@email.com" className="min-w-[220px] flex-1 border border-line rounded-sm px-3 py-2 text-sm" />
        <button disabled={pending || !email} onClick={submit} className="paint-graphite text-ivory rounded-sm px-4 py-2 text-sm font-semibold disabled:opacity-50">
          {pending ? 'Sending…' : 'Send invite'}
        </button>
      </div>
      {msg && <p className={`mt-2 text-sm ${msg.kind === 'ok' ? 'text-moss' : 'text-clay'}`} role={msg.kind === 'err' ? 'alert' : 'status'}>{msg.text}</p>}
    </section>
  );
}

export function BrokerDashboard({ listings, leads, profile, name, canInviteStaff }: { listings: Listing[]; leads: Lead[]; profile: BrokerProfile; name: string; canInviteStaff?: boolean }) {
  const views = listings.reduce((a, l) => a + l.viewsCount, 0);
  const stages = ['open', 'contacted', 'visit', 'closed'] as const;
  return (
    <div className="space-y-8">
      {!profile?.verified && (
        <section className="border border-clay rounded-md p-5 bg-white">
          <h3 className="font-serif-headline text-lg font-bold">{profile ? 'Verification pending' : 'Complete your broker profile'}</h3>
          <p className="text-sm text-stone mt-1">Your public profile and Verified badge go live after our team checks your RERA / agency proof.</p>
          <form action={saveBrokerProfile} className="grid gap-3 md:grid-cols-2 mt-4 text-sm">
            <input name="name" required placeholder="Your name" defaultValue={profile?.name ?? name} className="border border-line rounded-sm px-3 py-2" />
            <input name="firm" placeholder="Firm / agency name" defaultValue={profile?.firm_name ?? ''} className="border border-line rounded-sm px-3 py-2" />
            <input name="rera" placeholder="RERA registration number" defaultValue={profile?.rera_number ?? ''} className="border border-line rounded-sm px-3 py-2" />
            <input name="cities" placeholder="Cities (comma separated)" className="border border-line rounded-sm px-3 py-2" />
            <input name="years" type="number" placeholder="Years active" className="border border-line rounded-sm px-3 py-2" />
            <textarea name="bio" rows={2} placeholder="Short bio" className="border border-line rounded-sm px-3 py-2 md:col-span-2" />
            <button className="paint-graphite text-ivory rounded-sm px-4 py-2 font-semibold md:col-span-2 justify-self-start">{profile ? 'Update profile' : 'Submit for verification'}</button>
          </form>
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Listings" value={listings.length} />
        <Stat label="Total views" value={views} />
        <Stat label="Leads" value={leads.length} />
        <Stat label="Conversion" value={views ? `${((leads.length / views) * 100).toFixed(1)}%` : '—'} note="Leads ÷ views" />
      </div>
      {canInviteStaff && <InviteTeammate />}
      <section className={card}>
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h3 className="font-serif-headline text-xl font-bold">Listings</h3>
          <div className="flex gap-2 text-xs">
            <Link href="/post-listing" className="paint-clay text-ivory font-semibold px-4 py-2 rounded-sm">+ Add listing</Link>
            {profile?.verified && <Link href={`/broker/${profile.id}`} target="_blank" className="border border-line px-4 py-2 rounded-sm">Public profile ↗</Link>}
          </div>
        </div>
        <div className="divide-y divide-line">
          {listings.map((l) => <ListingRow key={l.id} l={l} />)}
          {!listings.length && <p className="py-8 text-center text-sm text-stone">No listings yet.</p>}
        </div>
      </section>
      <section className={card}>
        <h3 className="font-serif-headline text-xl font-bold pb-3 border-b border-line mb-4">Lead pipeline</h3>
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {stages.map((s) => (
            <div key={s} className="bg-ivory border border-line rounded-sm p-3">
              <div className="text-[11px] uppercase font-bold text-stone font-tabular">{LEAD_LABEL[s]} · {leads.filter((l) => l.status === s).length}</div>
              {leads.filter((l) => l.status === s).slice(0, 3).map((l) => <div key={l.id} className="text-xs mt-2 truncate">{l.buyerName}</div>)}
            </div>
          ))}
        </div>
        <LeadsInbox leads={leads} />
      </section>
    </div>
  );
}
