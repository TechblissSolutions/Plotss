'use client';
import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateListingAction } from '@/app/(app)/edit-actions';
import { LocationPicker, type LatLng } from '../components/LocationPicker';

export type EditInitial = {
  id: string; title: string; status: string; cityName: string; citySlug: string; description: string; priceCr: string; area: string;
  microMarket: string; roadWidth: string; powerLoad: string; contactPhone: string; lat: number | null; lng: number | null;
};

const input = 'mt-1 w-full rounded-sm border border-line bg-white px-3 py-2.5 text-sm text-graphite';
const label = 'block text-xs font-semibold text-stone';

export function EditListingForm({ initial }: { initial: EditInitial }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [pin, setPin] = useState<LatLng | null>(initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null);
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const set = (k: keyof EditInitial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (f.status === 'live' && !window.confirm('This listing will be hidden until our team reviews your changes. Continue?')) return;
    start(async () => {
      const r = await updateListingAction({
        id: f.id, description: f.description, priceCr: f.priceCr, area: f.area, microMarket: f.microMarket,
        roadWidth: f.roadWidth, powerLoad: f.powerLoad, contactPhone: f.contactPhone, lat: pin?.lat ?? null, lng: pin?.lng ?? null,
      });
      if ('error' in r) setError(r.error); else router.push('/dashboard/seller');
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-md border border-line bg-white p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-stone">{f.cityName}</div>
        <h2 className="font-serif-headline text-xl font-bold">{f.title}</h2>
        <p className="mt-1 text-sm text-stone">The title and city stay the same. To change them, post a new listing.</p>
      </div>

      <div className="grid gap-4 rounded-md border border-line bg-white p-5 sm:grid-cols-2">
        <label className={label}>Price (₹ crore)
          <input value={f.priceCr} onChange={set('priceCr')} inputMode="decimal" required className={input} />
        </label>
        <label className={label}>Area (acres)
          <input value={f.area} onChange={set('area')} inputMode="decimal" required className={input} />
        </label>
        <label className={`${label} sm:col-span-2`}>Area or locality
          <input value={f.microMarket} onChange={set('microMarket')} className={input} />
        </label>
        <label className={label}>Road access
          <input value={f.roadWidth} onChange={set('roadWidth')} placeholder="e.g. 30 m wide road" className={input} />
        </label>
        <label className={label}>Power
          <input value={f.powerLoad} onChange={set('powerLoad')} placeholder="e.g. 33 KV line nearby" className={input} />
        </label>
        <label className={`${label} sm:col-span-2`}>Description
          <textarea value={f.description} onChange={set('description')} rows={6} className={input} />
          <span className="mt-1 block font-normal text-stone">{f.description.length} / 4000. Longer, clear descriptions get more enquiries.</span>
        </label>
        <label className={label}>Contact number (10 digits)
          <input value={f.contactPhone} onChange={set('contactPhone')} inputMode="tel" required className={input} />
          <span className="mt-1 block font-normal text-stone">Shown only to signed-in buyers who unlock it.</span>
        </label>
      </div>

      <div className="rounded-md border border-line bg-white p-5">
        <h3 className="font-serif-headline text-lg font-bold">Exact location</h3>
        <p className="mb-3 text-sm text-stone">Click the map to place the pin. Listings with a pin appear in near-me search.</p>
        <LocationPicker value={pin} onChange={setPin} citySlug={f.citySlug} />
      </div>

      {error && <p role="alert" className="rounded-sm border border-clay bg-white p-3 text-sm text-clay">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="paint-graphite rounded-sm px-6 py-3 text-sm font-bold text-ivory disabled:opacity-60">{pending ? 'Saving…' : 'Save changes'}</button>
        <Link href="/dashboard/seller" className="rounded-sm border border-line px-5 py-3 text-sm font-semibold text-graphite">Cancel</Link>
        <span className="text-xs text-stone">Photos cannot be changed here yet.</span>
      </div>
    </form>
  );
}
