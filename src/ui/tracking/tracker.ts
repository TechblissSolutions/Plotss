'use client';
import type { EventType } from '@/lib/analytics/schema';

/**
 * Tiny first-party tracker. Nothing is sent until tracking is enabled (feature switch + visitor consent).
 * Events are batched and posted to our own /api/track endpoint; they are stored in our own database.
 * We never record what people type, only *which* field they touched.
 */
type Ev = { type: EventType; path: string; label?: string; props?: Record<string, string | number | boolean>; at: number };

const VID = 'plotss_vid';
const SID = 'plotss_sid';
const SESSION_MS = 30 * 60 * 1000;

let enabled = false;
let signedIn = false;
let queue: Ev[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

const uuid = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

function cookie(name: string): string | null {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}
function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
}

function ids() {
  let vid = cookie(VID);
  if (!vid) { vid = uuid(); }
  setCookie(VID, vid, 400 * 24 * 3600); // refresh: visitor id lives 13 months from last visit
  let sid = cookie(SID);
  if (!sid) sid = uuid();
  setCookie(SID, sid, SESSION_MS / 1000); // sliding 30-minute session
  return { vid, sid };
}

function landing() {
  try {
    const raw = sessionStorage.getItem('plotss_landing');
    if (raw) return JSON.parse(raw) as { referrer?: string; utm?: Record<string, string> };
    const q = new URLSearchParams(location.search);
    const ref = document.referrer && !document.referrer.includes(location.host) ? document.referrer : '';
    const info = { referrer: ref, utm: { source: q.get('utm_source') ?? '', medium: q.get('utm_medium') ?? '', campaign: q.get('utm_campaign') ?? '' } };
    sessionStorage.setItem('plotss_landing', JSON.stringify(info));
    return info;
  } catch { return {}; }
}

export function configureTracker(opts: { enabled: boolean; signedIn: boolean }) {
  enabled = opts.enabled;
  signedIn = opts.signedIn;
  if (!enabled) queue = [];
}

export function track(type: EventType, label?: string, props?: Ev['props'], path?: string) {
  if (!enabled || typeof window === 'undefined') return;
  queue.push({ type, label, props, path: path ?? location.pathname, at: Date.now() });
  if (queue.length >= 15) flush();
  else if (!timer) timer = setTimeout(flush, 4000);
}

export function flush() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!enabled || !queue.length) return;
  const events = queue.splice(0, 25);
  const { vid, sid } = ids();
  const l = landing();
  const body = JSON.stringify({ vid, sid, signedIn, referrer: l.referrer, utm: l.utm, events });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))) return;
  } catch { /* fall through */ }
  void fetch('/api/track', { method: 'POST', body, headers: { 'content-type': 'application/json' }, keepalive: true }).catch(() => {});
}

export const clearTrackingIds = () => {
  try { document.cookie = `${VID}=; path=/; max-age=0`; document.cookie = `${SID}=; path=/; max-age=0`; sessionStorage.removeItem('plotss_landing'); } catch { /* ignore */ }
};
