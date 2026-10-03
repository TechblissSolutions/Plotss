'use client';
import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { ORIGIN_PRESETS, type Origin } from '@/lib/geo';

export const RADIUS_OPTIONS = [0, 5, 10, 25, 50] as const;

/** "Near me" controls: use the device location or pick a starting area, then optionally limit the distance. */
export function NearMe({ origin, radius, onOrigin, onRadius }: {
  origin: Origin | null; radius: number; onOrigin: (o: Origin | null) => void; onRadius: (km: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const locate = () => {
    if (!navigator.geolocation) { setMsg('Your browser cannot share location. Pick an area instead.'); return; }
    setBusy(true); setMsg('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setBusy(false); onOrigin({ lat: p.coords.latitude, lng: p.coords.longitude, label: 'your location', exact: true }); },
      () => { setBusy(false); setMsg('We could not get your location. Pick an area instead.'); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <section aria-label="Find land near you" className="mb-6 rounded-sm border border-line bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <button type="button" onClick={locate} disabled={busy} className="paint-graphite inline-flex items-center gap-2 rounded-sm px-4 py-2.5 text-xs font-bold text-ivory disabled:opacity-60">
          <Crosshair className="h-4 w-4" aria-hidden />{busy ? 'Finding you…' : 'Use my location'}
        </button>
        <label className="text-xs font-semibold text-stone">Or start from
          <select value={origin && !origin.exact ? origin.label : ''} onChange={(e) => { const o = ORIGIN_PRESETS.find((p) => p.label === e.target.value); onOrigin(o ?? null); }}
            className="mt-1 block rounded-sm border border-line bg-white px-3 py-2.5 text-sm font-normal text-graphite">
            <option value="">Choose an area</option>
            {ORIGIN_PRESETS.map((p) => <option key={p.label}>{p.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-stone">Within
          <select value={radius} onChange={(e) => onRadius(Number(e.target.value))} disabled={!origin}
            className="mt-1 block rounded-sm border border-line bg-white px-3 py-2.5 text-sm font-normal text-graphite disabled:opacity-50">
            {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r === 0 ? 'Any distance' : `${r} km`}</option>)}
          </select>
        </label>
        {origin && <button type="button" onClick={() => { onOrigin(null); onRadius(0); }} className="pb-2.5 text-xs font-semibold text-clay hover:underline">Clear</button>}
      </div>
      <p role="status" className="mt-2 text-xs text-stone">
        {msg || (origin
          ? `Listings are sorted by distance from ${origin.label}${origin.exact ? '' : ' (approximate)'}. Distances are in a straight line, so the road is longer.`
          : 'Share your location or pick an area to see the nearest land first.')}
      </p>
    </section>
  );
}
