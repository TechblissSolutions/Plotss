'use client';
import React, { useEffect, useRef } from 'react';
import { MessageCircle, Phone, Send, Lock } from 'lucide-react';
import type { Listing } from '../types';
import { T } from '../content';
import { listingPoint, ORIGIN_PRESETS } from '@/lib/geo';

const isReal = (v?: string) => Boolean(v && v.trim() && !/^(n\/?a|na|-|—|none|not specified)$/i.test(v.trim()));

/** "Land details" table: only rows that have a real value are shown. */
export function ListingSpecs({ listing: l }: { listing: Listing }) {
  const rows: [string, string, React.ReactNode][] = [
    ['spec.type', 'Listing type', l.listingType],
    ['spec.category', 'Category', l.category],
    ['spec.zone', 'Land use / zone', l.zoneType],
    ['spec.area', 'Area', l.areaDisplay],
    ['spec.price', 'Price', l.priceDisplay],
    ['spec.rate', 'Rate', l.pricePerUnit],
    ['spec.location', 'Location', [l.microMarket, l.city, l.state].filter(Boolean).join(', ')],
    ['spec.road', 'Road access', l.roadWidth],
    ['spec.frontage', 'Frontage', l.frontage],
    ['spec.power', 'Power', l.powerSanction],
    ['spec.water', 'Water', l.waterAvailability],
    ['spec.far', 'Floor area ratio', l.farFsi],
    ['spec.by', 'Listed by', l.ownerType],
  ];
  const shown = rows.filter(([, , v]) => typeof v !== 'string' || isReal(v));
  return (
    <section id="listing-specs" className="rounded-md border border-line bg-white p-6 shadow-xs">
      <h3 className="font-serif-headline text-2xl font-bold text-graphite"><T k="listing.specs.title">Land details</T></h3>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {shown.map(([k, label, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-line py-2.5 text-sm">
            <dt className="text-stone"><T k={k}>{label}</T></dt>
            <dd className="text-right font-semibold text-graphite">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Single-marker OpenStreetMap view. Renders nothing when the listing has no coordinates. */
export function ListingLocationMap({ listing: l }: { listing: Listing }) {
  const el = useRef<HTMLDivElement>(null);
  // exact pin > known area > centre of the city, so every listing shows a map
  const exact = listingPoint(l);
  const cityCentre = ORIGIN_PRESETS.find((p) => l.city.toLowerCase().startsWith(p.label.split(' ')[0].toLowerCase()));
  const lat = exact?.lat ?? cityCentre?.lat, lng = exact?.lng ?? cityCentre?.lng;
  const approximate = !(l.lat != null && l.lng != null);

  useEffect(() => {
    if (lat == null || lng == null) return;
    let map: import('leaflet').Map | undefined;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      const style = getComputedStyle(document.documentElement);
      L.circleMarker([lat, lng], { radius: 10, color: style.getPropertyValue('--c-graphite').trim() || '#16181B', weight: 2, fillColor: style.getPropertyValue('--c-clay').trim() || '#B5502C', fillOpacity: 0.9 }).addTo(map);
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [lat, lng]);

  if (lat == null || lng == null) return null;
  return (
    <section id="listing-location" className="rounded-md border border-line bg-white p-6 shadow-xs">
      <h3 className="font-serif-headline text-2xl font-bold text-graphite"><T k="listing.map.title">Location on map</T></h3>
      <p className="mt-1 text-sm text-stone">{[l.microMarket, l.city].filter(Boolean).join(', ')}</p>
      <div ref={el} className="mt-4 h-72 w-full rounded-sm border border-line" aria-label="Map showing the listing location" />
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block rounded-sm border border-line px-3 py-2 text-xs font-semibold text-graphite hover:border-clay"><T k="listing.map.directions">Get directions</T> →</a>
      <p className="mt-2 text-xs text-stone">{approximate ? <T k="listing.map.note.approx">The seller has not added an exact pin yet, so the map shows the general area. The exact address is shared by the owner.</T> : <T k="listing.map.note">The pin shows the approximate area. The exact address is shared by the owner.</T>}</p>
    </section>
  );
}

/** Sticky bar at the bottom of the screen, every breakpoint: price (desktop) + call/WhatsApp/enquire in one tap. */
export function MobileActionBar({ listing, unlocked, phone, unlocking, onUnlock, onEnquire }: {
  listing: Listing; unlocked: boolean; phone?: string; unlocking?: boolean; onUnlock: () => void; onEnquire: () => void;
}) {
  const digits = (phone ?? '').replace(/\D/g, '');
  const wa = digits ? `https://wa.me/${digits.length === 10 ? '91' + digits : digits}?text=${encodeURIComponent(`Hi, I am interested in the listing: ${listing.title}`)}` : '';
  const base = 'flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-sm px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap';
  return (
    <div data-no-track-bar className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white p-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-0 sm:px-4">
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="text-[11px] font-bold uppercase tracking-wider text-clay">Pricing</span>
          <span className="text-sm font-bold text-graphite">{listing.priceDisplay || 'Contact for price'}</span>
        </div>
        <div className="flex flex-1 gap-2">
          {unlocked && phone ? (
            <>
              <a href={`tel:${phone.replace(/[^+\d]/g, '')}`} className={`${base} border border-line text-graphite`}><Phone className="h-4 w-4" /><T k="listing.bar.call">Call</T></a>
              <button type="button" onClick={onEnquire} className={`${base} paint-clay text-ivory`}><Send className="h-4 w-4" /><T k="listing.bar.enquire">Enquire Now</T></button>
              <a href={wa} target="_blank" rel="noopener noreferrer" className={`${base} paint-moss text-ivory`}><MessageCircle className="h-4 w-4" /><T k="listing.bar.whatsapp">WhatsApp</T></a>
            </>
          ) : (
            <>
              <button type="button" onClick={onUnlock} className={`${base} border border-line text-graphite`}><Lock className="h-4 w-4" />{unlocking ? '…' : <T k="listing.bar.unlock">Get contact</T>}</button>
              <button type="button" onClick={onEnquire} className={`${base} paint-clay text-ivory`}><Send className="h-4 w-4" /><T k="listing.bar.enquire">Enquire Now</T></button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Short highlight chips built from the listing facts that actually have a value. */
export function ListingHighlights({ listing: l }: { listing: Listing }) {
  const chips: [string, string, string][] = [];
  if (isReal(l.roadWidth)) chips.push(['chip.road', 'Road access', l.roadWidth]);
  if (isReal(l.powerSanction)) chips.push(['chip.power', 'Power', l.powerSanction]);
  if (isReal(l.waterAvailability)) chips.push(['chip.water', 'Water', l.waterAvailability]);
  if (isReal(l.frontage)) chips.push(['chip.frontage', 'Frontage', l.frontage]);
  if (isReal(l.connectivity?.highway)) chips.push(['chip.highway', 'Highway', l.connectivity.highway]);
  if (!chips.length) return null;
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {chips.slice(0, 3).map(([k, label, v]) => (
        <div key={k} className="rounded-md border border-line bg-white px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-clay"><T k={k}>{label}</T></div>
          <div className="mt-0.5 line-clamp-2 text-sm font-semibold text-graphite">{v}</div>
        </div>
      ))}
    </div>
  );
}

export type CallbackDetails = {
  name: string; phone: string; email: string; area: string; areaUnit: 'sq ft' | 'acres';
  timeline: '' | 'Immediate' | '1-3 months' | '3-6 months' | 'Just exploring'; requirements: string;
};

/** "Get a callback" form, top of the right column. Starts short (name + mobile); "Add more details"
 * reveals email, area/unit, move-in timeline and free-text requirements. Returns an error message or null. */
export function CallbackCard({ onSubmit }: { onSubmit: (d: CallbackDetails) => Promise<string | null> }) {
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [area, setArea] = React.useState('');
  const [areaUnit, setAreaUnit] = React.useState<CallbackDetails['areaUnit']>('sq ft');
  const [timeline, setTimeline] = React.useState<CallbackDetails['timeline']>('');
  const [requirements, setRequirements] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);
  const [state, setState] = React.useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = React.useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(phone.replace(/\D/g, '').slice(-10))) { setError('Enter a valid 10-digit mobile number.'); return; }
    setState('sending');
    const err = await onSubmit({ name: name.trim(), phone: phone.replace(/\D/g, '').slice(-10), email: email.trim(), area: area.trim(), areaUnit, timeline, requirements: requirements.trim() });
    if (err) { setError(err); setState('idle'); } else setState('done');
  };

  const fieldBase = 'rounded-sm border border-line bg-ivory p-2.5 text-sm focus:border-graphite focus:outline-none';
  const field = `${fieldBase} w-full`;
  return (
    <div id="callback-card" className="rounded-md border border-line bg-white p-5 shadow-xs">
      <h3 className="font-serif-headline text-lg font-bold text-graphite"><T k="listing.callback.title">Get a callback</T></h3>
      <p className="mt-0.5 text-xs text-stone"><T k="listing.callback.sub">An advisor will call you within 2 business hours.</T></p>
      {state === 'done' ? (
        <p className="mt-4 rounded-sm bg-sand p-3 text-sm font-semibold text-moss"><T k="listing.callback.thanks">Thank you. We will call you soon.</T></p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2.5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoComplete="name" required className={field} />
          <div className="flex overflow-hidden rounded-sm border border-line bg-ivory focus-within:border-graphite">
            <span className="border-r border-line px-3 py-2.5 text-sm text-stone">+91</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile" inputMode="tel" autoComplete="tel-national" required className="w-full bg-transparent p-2.5 text-sm focus:outline-none" />
          </div>

          {expanded && (
            <>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" autoComplete="email" className={field} />
              <div className="flex gap-2">
                <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area required" inputMode="numeric" className={`${fieldBase} min-w-0 flex-1`} />
                <select value={areaUnit} onChange={(e) => setAreaUnit(e.target.value as CallbackDetails['areaUnit'])} aria-label="Area unit" className={`${fieldBase} w-28 shrink-0`}>
                  <option value="sq ft">sq ft</option>
                  <option value="acres">acres</option>
                </select>
              </div>
              <select value={timeline} onChange={(e) => setTimeline(e.target.value as CallbackDetails['timeline'])} aria-label="Move-in timeline" className={field}>
                <option value="">Move-in timeline</option>
                <option value="Immediate">Immediate</option>
                <option value="1-3 months">1-3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="Just exploring">Just exploring</option>
              </select>
              <textarea value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="Any specific requirements?" rows={2} className={field} />
            </>
          )}
          <button type="button" onClick={() => setExpanded((v) => !v)} className="text-xs font-semibold text-clay underline">
            {expanded ? <T k="listing.callback.fewer">Fewer details</T> : <T k="listing.callback.more">Add more details</T>}
          </button>

          {error && <p role="alert" className="text-xs text-clay">{error}</p>}
          <button disabled={state === 'sending'} className="paint-clay w-full rounded-sm py-2.5 text-xs font-bold uppercase tracking-wider text-ivory disabled:opacity-60">
            {state === 'sending' ? 'Sending…' : <T k="listing.callback.btn">Send Enquiry</T>}
          </button>
          <p className="text-center text-[11px] text-stone flex items-center justify-center gap-1"><Lock className="h-3 w-3" /><T k="listing.callback.privacy">We respect your privacy. No spam.</T></p>
        </form>
      )}
    </div>
  );
}
