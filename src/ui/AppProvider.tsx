'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { Session } from '@/lib/types';
import { openAuth } from '@/components/AuthModal';
import { isSupabaseBrowserConfigured, supabaseBrowser } from '@/lib/supabase/client';
import { Header } from './components/Header';
import { useData } from './data/DataProvider';
import { loadSavedIds, mergeSaved, setSaved } from '@/app/(site)/saved-actions';
import { TrackingProvider } from './tracking/TrackingProvider';
import { Footer } from './components/Footer';
import { CompareTray } from './components/CompareTray';
import type { Listing, ScreenId, UserRole } from './types';

const PATHS: Record<ScreenId, (slug?: string) => string> = {
  home: () => '/',
  search: () => '/search',
  property_detail: (s) => `/listing/${s}`,
  post_property: () => '/post-listing',
  buyer_dashboard: () => '/dashboard/buyer',
  seller_dashboard: () => '/dashboard/seller',
  broker_dashboard: () => '/dashboard/broker',
  admin_panel: () => '/admin/listings',
  broker_profile: (s) => `/broker/${s ?? 'broker-1'}`,
};

function screenFromPath(p: string): ScreenId {
  if (p === '/') return 'home';
  if (p.startsWith('/search')) return 'search';
  if (p.startsWith('/listing/')) return 'property_detail';
  if (p.startsWith('/post-listing')) return 'post_property';
  if (p.startsWith('/dashboard/seller')) return 'seller_dashboard';
  if (p.startsWith('/dashboard/broker')) return 'broker_dashboard';
  if (p.startsWith('/dashboard')) return 'buyer_dashboard';
  if (p.startsWith('/broker')) return 'broker_profile';
  return 'home';
}

type Ctx = {
  navigate: (screen: ScreenId, slug?: string) => void;
  push: (url: string) => void;
  session: Session | null;
  isLoggedIn: boolean;
  role: UserRole;
  openAuth: () => void;
  savedIds: string[];
  toggleSave: (id: string) => void;
  compared: Listing[];
  toggleCompare: (l: Listing) => void;
  clearCompare: () => void;
};
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
};

const SAVED_KEY = 'plotss-saved';

export function AppShell({ session, children }: { session: Session | null; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { features } = useData();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [compared, setCompared] = useState<Listing[]>([]);

  useEffect(() => {
    // Hydrate from localStorage after mount (server render has no access to it).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setSavedIds(JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')); } catch { /* storage blocked */ }
  }, []);

  const navigate = useCallback((screen: ScreenId, slug?: string) => {
    router.push(PATHS[screen](slug));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router]);

  const signedIn = Boolean(session);
  // When signed in, saved listings live in the account. Merge anything saved on this device first.
  useEffect(() => {
    if (!signedIn) return;
    let dead = false;
    (async () => {
      let local: string[] = [];
      try { local = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]'); } catch { /* storage blocked */ }
      const server = await loadSavedIds();
      const extra = local.filter((x) => !server.includes(x));
      if (extra.length) await mergeSaved(extra);
      if (!dead) setSavedIds([...new Set([...server, ...local])]);
    })();
    return () => { dead = true; };
  }, [signedIn]);

  const toggleSave = useCallback((id: string) => {
    const on = !savedIds.includes(id);
    const next = on ? [...savedIds, id] : savedIds.filter((x) => x !== id);
    setSavedIds(next);
    // For signed-in users, DB is source of truth; localStorage is a secondary cache only.
    if (signedIn) {
      setSaved(id, on).then((result) => {
        if (!result?.ok) {
          // Revert optimistic update on failure
          setSavedIds((prev) => on ? prev.filter((x) => x !== id) : [...prev, id]);
        } else {
          // Secondary: keep localStorage in sync as offline cache
          try { localStorage.setItem(SAVED_KEY, JSON.stringify(on ? [...savedIds, id] : savedIds.filter((x) => x !== id))); } catch { /* ignore */ }
        }
      }).catch(() => {
        setSavedIds((prev) => on ? prev.filter((x) => x !== id) : [...prev, id]);
      });
    } else {
      // Not signed in: localStorage is the primary store
      try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    }
  }, [savedIds, signedIn]);

  const toggleCompare = useCallback((l: Listing) => {
    setCompared((prev) => {
      if (prev.some((x) => x.id === l.id)) return prev.filter((x) => x.id !== l.id);
      return prev.length >= 3 ? [prev[1], prev[2], l] : [...prev, l];
    });
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseBrowserConfigured) await supabaseBrowser().auth.signOut();
    else await fetch('/api/dev-login', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }, [router]);

  const role = (session?.role ?? 'buyer') as UserRole;
  const value = useMemo<Ctx>(() => ({
    navigate, push: (url: string) => router.push(url), session, isLoggedIn: Boolean(session), role, openAuth, savedIds, toggleSave,
    compared, toggleCompare, clearCompare: () => setCompared([]),
  }), [navigate, router, session, role, savedIds, toggleSave, compared, toggleCompare]);

  return (
    <AppCtx.Provider value={value}>
      <Header
        currentScreen={screenFromPath(pathname)}
        onNavigate={navigate}
        userRole={role}
        isLoggedIn={Boolean(session)}
        onOpenAuth={openAuth}
        onLogout={logout}
        savedCount={savedIds.length}
      />
      <div className="flex-1">{children}</div>
      <TrackingProvider features={features} signedIn={Boolean(session)} staff={session?.role === "admin"} />
      <Footer onNavigate={navigate} />
      <CompareTray
        selectedPlots={compared}
        onRemovePlot={(id) => setCompared((p) => p.filter((x) => x.id !== id))}
        onClearAll={() => setCompared([])}
        onSelectForDetail={(slug) => navigate('property_detail', slug)}
      />
    </AppCtx.Provider>
  );
}
