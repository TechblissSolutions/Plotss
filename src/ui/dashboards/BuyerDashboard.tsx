'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { MessageCircle, Phone, Search } from 'lucide-react';
import { saveRequirement } from '@/app/(app)/requirement-actions';
import { setSaved } from '@/app/(site)/saved-actions';
import type { buyerData } from '@/lib/db/dashboards';
import type { Listing } from '../types';
import { CATEGORY_LIST } from '../data/taxonomy';

type Data = Awaited<ReturnType<typeof buyerData>>;

const card = 'bg-white rounded-md border border-line p-5';
const field = 'w-full rounded-sm border border-line bg-white px-3 py-2.5 text-sm text-graphite';

function Stat({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className={card}>
      <div className="font-tabular text-[11px] font-bold uppercase tracking-wider text-stone">{label}</div>
      <div className="mt-1 font-tabular text-3xl font-black">{value}</div>
      {note && <div className="mt-1 text-xs text-stone">{note}</div>}
    </div>
  );
}

function ListingCardMini({ l, children }: { l: Listing; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-line bg-white">
      <Link href={`/listing/${l.slug}`} className="block hover:opacity-95">
        {l.realImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.realImageUrl} alt="" loading="lazy" className="aspect-[16/8] w-full object-cover" />
        )}
        <div className="p-3">
          <div className="text-xs text-stone">{l.city} · {l.areaDisplay.split(' (')[0]}</div>
          <div className="font-serif-headline line-clamp-2 font-bold leading-snug">{l.title}</div>
          <div className="font-tabular mt-2 font-bold">{l.priceDisplay}</div>
        </div>
      </Link>
      {children && <div className="mt-auto border-t border-line p-3">{children}</div>}
    </div>
  );
}

const waLink = (phone: string, title: string) => {
  const d = phone.replace(/\D/g, '');
  return `https://wa.me/${d.length === 10 ? '91' + d : d}?text=${encodeURIComponent(`Hello, I am interested in "${title}" listed on PLOTSS.`)}`;
};

function RequirementCard({ d }: { d: Data }) {
  const [saved, setDone] = useState(false);
  const [pending, start] = useTransition();
  const submit = (f: FormData) => start(async () => { await saveRequirement(f); setDone(true); });
  return (
    <section aria-labelledby="req-h" className={card}>
      <h3 id="req-h" className="font-serif-headline text-xl font-bold">What are you looking for?</h3>
      <p className="mt-1 text-sm text-stone">Tell us once. We will show matching new listings here.</p>
      <form action={submit} onChange={() => setDone(false)} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-stone">City
          <select name="city" defaultValue={d.requirement.city} className={`${field} mt-1`}>
            <option value="">Any city</option>
            {d.cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-stone">Type of land
          <select name="category" defaultValue={d.requirement.category} className={`${field} mt-1`}>
            <option value="">Any type</option>
            {CATEGORY_LIST.map((c) => <option key={c.slug}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-stone">Highest budget (₹ crore)
          <input name="maxBudgetCr" inputMode="decimal" defaultValue={d.requirement.maxBudgetCr ?? ''} placeholder="e.g. 5" className={`${field} mt-1`} />
        </label>
        <div className="flex items-end gap-3">
          <button type="submit" disabled={pending} className="paint-graphite rounded-sm px-5 py-2.5 text-sm font-bold text-ivory disabled:opacity-60">{pending ? 'Saving…' : 'Save'}</button>
          <span role="status" className="pb-2 text-xs text-moss">{saved ? 'Saved' : ''}</span>
        </div>
      </form>
    </section>
  );
}

function SavedList({ items }: { items: Listing[] }) {
  const [rows, setRows] = useState(items);
  const remove = (id: string) => { setRows((r) => r.filter((x) => x.id !== id)); void setSaved(id, false); };
  if (!rows.length) return <p className="text-sm text-stone">Nothing saved yet. Tap Save on any listing to keep it here, on every device you sign in from.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((l) => (
        <ListingCardMini key={l.id} l={l}>
          <button onClick={() => remove(l.id)} className="text-xs font-semibold text-clay hover:underline">Remove<span className="sr-only"> {l.title} from saved</span></button>
        </ListingCardMini>
      ))}
    </div>
  );
}

export function BuyerDashboard({ d }: { d: Data }) {
  const [q, setQ] = useState('');
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Unlocks left today" value={<>{d.unlocksLeft}<span className="text-sm font-medium text-stone"> / {d.unlockLimit}</span></>} note="Resets every 24 hours" />
        <Stat label="Contacted" value={d.contacted.length} />
        <Stat label="Saved" value={d.saved.length} />
        <Stat label="Matches for you" value={d.matches.length} note={d.hasRequirement ? 'Based on what you told us' : 'Set what you need below'} />
      </div>

      <RequirementCard d={d} />

      <section aria-labelledby="match-h" className={card}>
        <div className="mb-4 flex items-center gap-3">
          <h3 id="match-h" className="font-serif-headline text-xl font-bold">{d.hasRequirement ? 'New matches for you' : 'Latest listings'}</h3>
          {d.hasRequirement && <span className="ai-tag">For you</span>}
        </div>
        {d.matches.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{d.matches.map((l) => <ListingCardMini key={l.id} l={l} />)}</div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-stone">Nothing matches yet. Try a wider budget or another city, or describe it in your own words.</p>
            <form action={`/search`} className="mx-auto mt-4 flex max-w-lg gap-2">
              <label className="sr-only" htmlFor="buyer-q">Describe the land you want</label>
              <input id="buyer-q" name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. 3 acre industrial land near Ghaziabad under 5Cr" className={`${field} flex-1`} />
              <button className="paint-graphite inline-flex items-center gap-1.5 rounded-sm px-4 py-2.5 text-sm font-bold text-ivory"><Search className="h-4 w-4" aria-hidden />Search</button>
            </form>
          </div>
        )}
      </section>

      <section aria-labelledby="contacted-h" className={card}>
        <h3 id="contacted-h" className="font-serif-headline mb-4 text-xl font-bold">Owners you contacted</h3>
        {d.contacted.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.contacted.map((l) => (
              <ListingCardMini key={l.id} l={l}>
                {l.contact ? (
                  <div>
                    <div className="text-sm font-semibold text-graphite">{l.contact.name}</div>
                    <div className="mt-2 flex gap-2">
                      <a href={`tel:${l.contact.phone}`} className="paint-graphite inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-xs font-bold text-ivory"><Phone className="h-3.5 w-3.5" aria-hidden />Call<span className="sr-only"> {l.contact.name}</span></a>
                      <a href={waLink(l.contact.phone, l.title)} target="_blank" rel="noopener noreferrer" className="paint-moss inline-flex flex-1 items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-xs font-bold text-ivory"><MessageCircle className="h-3.5 w-3.5" aria-hidden />WhatsApp<span className="sr-only"> {l.contact.name}</span></a>
                    </div>
                  </div>
                ) : <span className="text-xs text-stone">Contact is no longer available.</span>}
              </ListingCardMini>
            ))}
          </div>
        ) : <p className="text-sm text-stone">You have not unlocked any owner contact yet. <Link href="/search" className="font-semibold text-clay">Start searching</Link>.</p>}
      </section>

      <section aria-labelledby="saved-h" className={card}>
        <h3 id="saved-h" className="font-serif-headline mb-4 text-xl font-bold">Saved listings</h3>
        <SavedList items={d.saved} />
      </section>
    </div>
  );
}
