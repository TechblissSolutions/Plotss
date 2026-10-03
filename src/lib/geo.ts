import type { Listing } from "@/ui/types";
import { coordsFor } from "@/ui/components/ListingsMap";

export type Point = { lat: number; lng: number };
export type Origin = Point & { label: string; exact: boolean };

/** Starting points people can pick when they do not share their location. Coordinates are approximate area centres. */
export const ORIGIN_PRESETS: Origin[] = [
  { label: "Ghaziabad", lat: 28.6692, lng: 77.4538, exact: false },
  { label: "Indirapuram", lat: 28.6408, lng: 77.3689, exact: false },
  { label: "Raj Nagar Extension", lat: 28.697, lng: 77.437, exact: false },
  { label: "Sahibabad", lat: 28.68, lng: 77.36, exact: false },
  { label: "Noida", lat: 28.5355, lng: 77.391, exact: false },
  { label: "Noida Sector 62", lat: 28.627, lng: 77.365, exact: false },
  { label: "Greater Noida", lat: 28.4744, lng: 77.504, exact: false },
  { label: "New Delhi (Connaught Place)", lat: 28.6315, lng: 77.2167, exact: false },
  { label: "Chhatarpur, Delhi", lat: 28.5, lng: 77.18, exact: false },
  { label: "Narela, Delhi", lat: 28.85, lng: 77.09, exact: false },
];

/** Straight-line distance in km (haversine). Roads are longer, so the UI says "about". */
export function distanceKm(a: Point, b: Point): number {
  const R = 6371, rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function listingPoint(l: Listing): Point | null {
  if (l.lat != null && l.lng != null) return { lat: l.lat, lng: l.lng };
  const c = coordsFor(l.slug);
  return c ? { lat: c[0], lng: c[1] } : null;
}

export const formatKm = (km: number) => (km < 1 ? "under 1 km" : km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`);

/** Opens the listing's pin (or its approximate micro-market point) in Google Maps, new tab. */
export function mapsHref(l: Listing): string {
  const p = listingPoint(l);
  return p ? `https://www.google.com/maps?q=${p.lat},${p.lng}` : `https://www.google.com/maps/search/${encodeURIComponent(`${l.microMarket}, ${l.city}`)}`;
}
