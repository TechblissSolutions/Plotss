'use client';
import React from 'react';
import { revealContactAction, submitEnquiryAction, trackViewAction } from '@/app/(site)/actions';
import { generateDescriptionAction, parseQueryAction } from '@/app/(site)/ai-actions';
import { submitListingAction } from '@/app/(site)/post-listing/actions';
import { isSupabaseBrowserConfigured, supabaseBrowser } from '@/lib/supabase/client';
import { useData } from './data/DataProvider';
import { track } from './tracking/tracker';
import type { Listing } from './types';
import { useApp } from './AppProvider';
import { HomeScreen } from './screens/HomeScreen';
import { SearchScreen } from './screens/SearchScreen';
import { PropertyDetailScreen } from './screens/PropertyDetailScreen';
import { PostPropertyScreen, type SubmitFiles, type SubmitPayload } from './screens/PostPropertyScreen';
import { BrokerProfileScreen } from './screens/BrokerProfileScreen';
import type { UserRole } from './types';

export function HomeRoute() {
  const a = useApp();
  return (
    <HomeScreen
      onNavigate={a.navigate}
      onSearchQuerySubmit={(q) => a.push(`/search?q=${encodeURIComponent(q)}`)}
      onSelectListing={(slug) => a.navigate('property_detail', slug)}
      savedIds={a.savedIds}
      onToggleSave={a.toggleSave}
      onAddToCompare={a.toggleCompare}
      comparedIds={a.compared.map((p) => p.id)}
    />
  );
}

export function SearchRoute({ q }: { q?: string }) {
  const a = useApp();
  return (
    <SearchScreen
      initialQuery={q ?? ''}
      onParseQuery={parseQueryAction}
      initialType="Buy"
      onSelectListing={(slug) => a.navigate('property_detail', slug)}
      onNavigate={a.navigate}
      onUnlockContact={(l) => (a.isLoggedIn ? a.navigate('property_detail', l.slug) : a.openAuth())}
      savedIds={a.savedIds}
      onToggleSave={a.toggleSave}
      comparedListings={a.compared}
      onToggleCompare={a.toggleCompare}
    />
  );
}

export function DetailRoute({ slug, listing: fresh }: { slug: string; listing?: Listing }) {
  const a = useApp();
  const { listings } = useData();
  const [contact, setContact] = React.useState<{ name: string; phone: string } | null>(null);
  const [unlocking, setUnlocking] = React.useState(false);
  const [error, setError] = React.useState('');
  const listing = fresh ?? listings.find((l) => l.slug === slug);

  // Count one view per browser session per listing.
  React.useEffect(() => {
    if (!listing) return;
    try {
      const key = `viewed:${listing.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* storage blocked: count anyway */ }
    void trackViewAction(listing.id);
  }, [listing]);

  React.useEffect(() => { if (listing) track('listing_view', listing.slug); }, [listing]);

  const unlock = async (l: Listing) => {
    if (!a.isLoggedIn) return a.openAuth();
    setUnlocking(true); setError('');
    const r = await revealContactAction(l.id);
    setUnlocking(false);
    if (r.ok) setContact({ name: r.name, phone: r.phone }); else setError(r.error);
  };

  return (
    <>
      {error && <div className="bg-clay text-ivory text-center text-sm py-2" role="alert">{error}</div>}
      <PropertyDetailScreen
        slug={slug}
        listingData={listing}
        onNavigate={a.navigate}
        onOpenAuth={a.openAuth}
        isContactUnlocked={Boolean(contact)}
        contact={contact}
        unlocking={unlocking}
        onUnlockContact={unlock}
        onSubmitEnquiry={async (l, message, date) => {
          if (!a.isLoggedIn) { a.openAuth(); return 'Sign in to send an enquiry'; }
          const r = await submitEnquiryAction(l.id, message, date);
          return r.ok ? null : r.error;
        }}
        savedIds={a.savedIds}
        onToggleSave={a.toggleSave}
      />
    </>
  );
}

export function PostRoute() {
  const a = useApp();

  /** Uploads photos (public bucket) and documents (private bucket) into the user's own folder, then saves the listing. */
  const submit = async (payload: SubmitPayload, files: SubmitFiles) => {
    const uploaded: { photos: string[]; docs: { name: string; path: string }[] } = { photos: [], docs: [] };
    if (isSupabaseBrowserConfigured && (files.photos.length || files.docs.length)) {
      const sb = supabaseBrowser();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return { error: 'Please sign in again.' };
      const ext = (f: File) => (f.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5);
      for (const f of files.photos) {
        const path = `${user.id}/${crypto.randomUUID()}.${ext(f)}`;
        const { error } = await sb.storage.from('listing-photos').upload(path, f, { contentType: f.type });
        if (error) return { error: 'Photo upload failed: ' + error.message };
        uploaded.photos.push(sb.storage.from('listing-photos').getPublicUrl(path).data.publicUrl);
      }
      for (const d of files.docs) {
        const path = `${user.id}/${crypto.randomUUID()}.${ext(d.file)}`;
        const { error } = await sb.storage.from('listing-docs').upload(path, d.file, { contentType: d.file.type });
        if (error) return { error: 'Document upload failed: ' + error.message };
        uploaded.docs.push({ name: d.name, path });
      }
    }
    return submitListingAction(payload, uploaded);
  };

  return (
    <PostPropertyScreen
      onNavigate={a.navigate}
      isLoggedIn={a.isLoggedIn}
      onRequireAuth={a.openAuth}
      defaultPhone={a.session?.phone?.replace(/^\+91/, '') ?? ''}
      onSubmitListing={submit}
      onGenerateDescription={generateDescriptionAction}
    />
  );
}

export function BrokerRoute({ id }: { id: string }) {
  const a = useApp();
  return (
    <BrokerProfileScreen
      brokerId={id}
      onNavigate={a.navigate}
      onOpenAuth={a.openAuth}
      isAuthenticated={a.isLoggedIn}
      onSelectListing={(slug) => a.navigate('property_detail', slug)}
      onUnlockContact={(l) => (a.isLoggedIn ? a.navigate('property_detail', l.slug) : a.openAuth())}
    />
  );
}

