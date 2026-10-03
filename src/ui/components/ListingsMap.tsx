'use client';
import React, { useEffect, useRef } from 'react';
import type { Listing } from '../types';

// Approximate hub coordinates for the demo listings, keyed by a fragment of the slug.
const COORDS: [string, [number, number]][] = [
  ['hinjawadi', [18.5912, 73.7389]], ['lonavala', [18.7481, 73.4072]], ['chakan', [18.76, 73.863]],
  ['sanand', [22.992, 72.381]], ['bhiwandi', [19.2813, 73.0483]], ['devanahalli', [13.247, 77.713]],
  ['alibaug', [18.8073, 72.8998]], ['sriperumbudur', [12.967, 79.942]], ['hosur', [12.7409, 77.8253]],
  ['noida', [28.5355, 77.391]], ['ghaziabad', [28.6692, 77.4538]], ['raj-nagar', [28.6789, 77.4390]], ['delhi', [28.6139, 77.209]],
];
export const coordsFor = (slug: string): [number, number] | null =>
  COORDS.find(([k]) => slug.includes(k))?.[1] ?? null;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** OpenStreetMap (Leaflet) view of the current result set. Leaflet is loaded lazily, client-side only. */
export function ListingsMap({ listings, onSelect, origin }: { listings: Listing[]; onSelect: (slug: string) => void; origin?: { lat: number; lng: number; label: string } | null }) {
  const el = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; });

  useEffect(() => {
    let map: import('leaflet').Map | undefined;
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current) return;
      map = L.map(el.current, { scrollWheelZoom: false }).setView([21, 78], 5);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const style = getComputedStyle(document.documentElement);
      const clay = style.getPropertyValue('--c-clay').trim() || '#B5502C';
      const graphite = style.getPropertyValue('--c-graphite').trim() || '#16181B';
      const pts: [number, number][] = [];
      for (const l of listings) {
        const c: [number, number] | null = l.lat != null && l.lng != null ? [l.lat, l.lng] : coordsFor(l.slug);
        if (!c) continue;
        pts.push(c);
        const m = L.circleMarker(c, { radius: 9, color: graphite, weight: 2, fillColor: clay, fillOpacity: 0.9 }).addTo(map);
        const box = document.createElement('div');
        box.innerHTML = `<strong>${esc(l.title)}</strong><br/><span>${esc(l.city)} · ${esc(l.priceDisplay)}</span><br/>`;
        const btn = document.createElement('button');
        btn.textContent = 'View dossier →';
        btn.style.cssText = 'margin-top:6px;color:' + clay + ';font-weight:600;cursor:pointer';
        btn.onclick = () => onSelectRef.current(l.slug);
        box.appendChild(btn);
        m.bindPopup(box);
      }
      if (origin) {
        const o: [number, number] = [origin.lat, origin.lng];
        L.circleMarker(o, { radius: 8, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 }).addTo(map).bindTooltip(`Start: ${esc(origin.label)}`);
        pts.push(o);
      }
      if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: origin ? 12 : 9 });
    })();
    return () => { cancelled = true; map?.remove(); };
  }, [listings, origin]);

  return (
    <div className="relative">
      <div ref={el} className="h-[560px] w-full rounded-sm border border-line" aria-label="Map of matching listings" />
    </div>
  );
}
