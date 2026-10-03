'use client';
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Features } from '@/lib/features-shared';
import { clearTrackingIds, configureTracker, flush, track } from './tracker';

const CONSENT_KEY = 'plotss_consent';

function labelFor(el: Element): string {
  const h = el as HTMLElement;
  const explicit = h.getAttribute('data-track') || h.getAttribute('aria-label') || h.getAttribute('title');
  const text = (h.innerText || h.textContent || '').replace(/\s+/g, ' ').trim();
  return (explicit || text || h.id || h.tagName.toLowerCase()).slice(0, 60);
}

/** Consent banner + automatic tracking of page views, clicks, scroll depth, time on page and form-field focus. */
export function TrackingProvider({ features, signedIn, staff = false }: { features: Features; signedIn: boolean; staff?: boolean }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<'granted' | 'denied' | 'unknown'>('unknown');
  const startRef = useRef({ path: '', at: 0, maxScroll: 0, marks: new Set<number>() });
  const lastField = useRef('');

  // read the stored choice after mount (server render cannot see localStorage)
  useEffect(() => {
    try {
      const v = localStorage.getItem(CONSENT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (v === 'granted' || v === 'denied') setConsent(v);
    } catch { /* storage blocked: stay unknown */ }
  }, []);

  const active = features.tracking && !staff && (features.consentBanner ? consent === 'granted' : true);

  useEffect(() => {
    configureTracker({ enabled: active, signedIn });
    if (!active && consent === 'denied') clearTrackingIds();
  }, [active, signedIn, consent]);

  // page views + time on page
  useEffect(() => {
    if (!active) return;
    const prev = startRef.current;
    if (prev.path && prev.path !== pathname) {
      track('page_leave', undefined, { ms: Date.now() - prev.at, maxScroll: prev.maxScroll }, prev.path);
    }
    startRef.current = { path: pathname, at: Date.now(), maxScroll: 0, marks: new Set() };
    lastField.current = '';
    track('page_view', undefined, undefined, pathname);
  }, [pathname, active]);

  useEffect(() => {
    if (!active) return;

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest('button, a, [role="button"], summary, [data-track]');
      if (!el || el.closest('[data-no-track]')) return;
      const href = el.getAttribute('href') || '';
      const kind = href.startsWith('tel:') ? 'tel' : href.includes('wa.me') ? 'whatsapp' : href.startsWith('mailto:') ? 'email' : /^https?:/.test(href) && !href.includes(location.host) ? 'external' : href ? 'link' : 'button';
      track('click', labelFor(el), { kind, ...(kind === 'link' ? { to: href.split('?')[0].slice(0, 60) } : {}) });
    };

    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLInputElement | null;
      if (!el || !/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (['password', 'hidden'].includes(el.type)) return;
      const field = (el.name || el.id || el.getAttribute('aria-label') || el.placeholder || el.type || 'field').slice(0, 30);
      if (field === lastField.current) return;
      lastField.current = field;
      track('form_field', location.pathname === '/post-listing' ? 'post' : location.pathname, { field });
    };

    const onScroll = () => {
      const doc = document.documentElement;
      const pct = Math.round(((window.scrollY + window.innerHeight) / Math.max(1, doc.scrollHeight)) * 100);
      const s = startRef.current;
      if (pct > s.maxScroll) s.maxScroll = Math.min(100, pct);
      for (const mark of [25, 50, 75, 100]) {
        if (pct >= mark && !s.marks.has(mark)) { s.marks.add(mark); track('scroll', undefined, { depth: mark }); }
      }
    };

    const onHide = () => {
      if (document.visibilityState !== 'hidden') return;
      const s = startRef.current;
      track('page_leave', undefined, { ms: Date.now() - s.at, maxScroll: s.maxScroll }, s.path);
      flush();
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('focusin', onFocus);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('focusin', onFocus);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, [active]);

  const choose = (v: 'granted' | 'denied') => {
    setConsent(v);
    try { localStorage.setItem(CONSENT_KEY, v); } catch { /* ignore */ }
  };

  if (!features.tracking || !features.consentBanner || consent !== 'unknown') return null;
  return (
    <div role="dialog" aria-label="Analytics consent" data-no-track className="fixed bottom-4 left-4 z-50 max-w-sm rounded-md border border-line bg-white p-4 text-xs shadow-lg">
      <p className="text-graphite">
        We use privacy-friendly analytics stored on our own servers to see which pages and buttons help visitors, so we can improve PLOTSS.
        We never record what you type.
      </p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => choose('granted')} className="paint-graphite rounded-sm px-3 py-1.5 font-semibold text-ivory">Accept</button>
        <button onClick={() => choose('denied')} className="rounded-sm border border-line px-3 py-1.5 font-semibold">Decline</button>
      </div>
    </div>
  );
}
