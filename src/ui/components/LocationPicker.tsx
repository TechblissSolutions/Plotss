'use client';
import React, { useEffect, useRef } from 'react';

export type LatLng = { lat: number; lng: number };

// Rough centres of supported cities so the map opens near the right place.
const CITY_CENTERS: Record<string, [number, number]> = {
  ghaziabad: [28.6692, 77.4538], noida: [28.5355, 77.391], 'new-delhi': [28.6139, 77.209], pune: [18.52, 73.86], ahmedabad: [23.02, 72.57], mumbai: [19.08, 72.88], chennai: [13.08, 80.27],
  bengaluru: [12.97, 77.59], hyderabad: [17.39, 78.49], 'delhi-ncr': [28.61, 77.21], jaipur: [26.91, 75.79], nashik: [19.99, 73.79],
};

/** Click-to-place pin on an OpenStreetMap map (Leaflet, loaded on demand). */
export function LocationPicker({ value, onChange, citySlug }: { value: LatLng | null; onChange: (v: LatLng) => void; citySlug?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<import('leaflet').Map | null>(null);
  const marker = useRef<import('leaflet').CircleMarker | null>(null);
  const cb = useRef(onChange);
  useEffect(() => { cb.current = onChange; });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !el.current || map.current) return;
      const start = value ? [value.lat, value.lng] as [number, number] : CITY_CENTERS[citySlug ?? ''] ?? [21, 78];
      const m = L.map(el.current, { scrollWheelZoom: true }).setView(start, value ? 15 : citySlug && CITY_CENTERS[citySlug] ? 11 : 5);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(m);
      const style = getComputedStyle(document.documentElement);
      const opts = { radius: 10, color: style.getPropertyValue('--c-graphite').trim() || '#16181B', weight: 3, fillColor: style.getPropertyValue('--c-clay').trim() || '#B5502C', fillOpacity: 0.95 };
      if (value) marker.current = L.circleMarker([value.lat, value.lng], opts).addTo(m);
      m.on('click', (e) => {
        if (marker.current) marker.current.setLatLng(e.latlng); else marker.current = L.circleMarker(e.latlng, opts).addTo(m);
        cb.current({ lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) });
      });
      map.current = m;
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; marker.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-centre when the city changes and no pin has been placed yet.
  useEffect(() => {
    if (!value && citySlug && CITY_CENTERS[citySlug]) map.current?.setView(CITY_CENTERS[citySlug], 11);
  }, [citySlug, value]);

  return <div ref={el} className="h-72 w-full rounded-sm border border-line" aria-label="Pick the plot location on the map" />;
}
