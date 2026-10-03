'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { track } from '../tracking/tracker';
import { T } from '../content';
import { useData } from '../data/DataProvider';
import { LocationPicker, type LatLng } from '../components/LocationPicker';
import type { ScreenId } from '../types';

export type SubmitPayload = {
  category: string; listingType: string; zoneType: string; area: string; price: string; roadWidth: string; powerLoad: string;
  city: string; microMarket: string; lat: number | null; lng: number | null; rawText: string; description: string;
  docs: { name: string }[]; contactPhone: string;
};
export type SubmitFiles = { photos: File[]; docs: { name: string; file: File }[] };
export type DescribeInput = {
  category: string; city: string; microMarket: string; area: number; price: number; roadWidth: string; power: string; zone: string;
  notes: string; tone: 'institutional' | 'concise' | 'technical';
};

interface Props {
  onNavigate: (screen: ScreenId) => void;
  isLoggedIn?: boolean;
  onRequireAuth?: () => void;
  defaultPhone?: string;
  onSubmitListing?: (p: SubmitPayload, files: SubmitFiles) => Promise<{ error: string } | { slug: string }>;
  onGenerateDescription?: (i: DescribeInput) => Promise<{ text: string; source: 'ai' | 'template' } | { error: string }>;
}

const STEPS = ['Details', 'Location', 'Documents', 'Photos', 'Description', 'Preview', 'Submit'];
const DOC_SUGGESTIONS = ['Ownership document (sale deed / allotment letter)', '7/12 extract or equivalent revenue record', 'Encumbrance certificate', 'NOC / consent from authority', 'Boundary survey', 'Property tax receipt'];
const ZONES = ['Industrial (Heavy/Chemical)', 'Industrial (Light/Engineering)', 'Warehousing & Logistics', 'Commercial IT/SEZ', 'Commercial Mixed-Use', 'Residential NA (R-Zone)', 'Agricultural / Future Urban'];
const MAX_PHOTOS = 6;
const MAX_PHOTO_MB = 5;
const MAX_DOC_MB = 10;

const field = 'w-full bg-ivory p-2.5 rounded-sm border border-line text-graphite text-sm focus:outline-none focus:border-graphite';
const label = 'block font-bold text-graphite uppercase font-tabular text-xs mb-1.5';

export const PostPropertyScreen: React.FC<Props> = ({ onNavigate, isLoggedIn = true, onRequireAuth, defaultPhone = '', onSubmitListing, onGenerateDescription }) => {
  const { cities, features } = useData();
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState('Industrial');
  const [listingType, setListingType] = useState('Buy');
  const [zoneType, setZoneType] = useState(ZONES[1]);
  const [area, setArea] = useState('');
  const [price, setPrice] = useState('');
  const [roadWidth, setRoadWidth] = useState('');
  const [powerLoad, setPowerLoad] = useState('');
  const [city, setCity] = useState('');
  const [microMarket, setMicroMarket] = useState('');
  const [pin, setPin] = useState<LatLng | null>(null);
  const [docs, setDocs] = useState<{ name: string; file: File | null }[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [rawText, setRawText] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState<'institutional' | 'concise' | 'technical'>('institutional');
  const [aiSource, setAiSource] = useState<'ai' | 'template' | null>(null);
  const [generating, setGenerating] = useState(false);
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  // Steps shown to the seller; the Documents step (3) only exists when documents are collected.
  const flow = useMemo(() => (features.collectDocuments ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 4, 5, 6, 7]), [features.collectDocuments]);
  const go = (delta: number) => setStep((cur) => flow[Math.min(flow.length - 1, Math.max(0, flow.indexOf(cur) + delta))]);

  // Journey tracking: which step of the seller form is on screen (no field values are ever sent).
  useEffect(() => { track('form_step', 'post', { step: STEPS[step - 1].toLowerCase() }); }, [step]);

  const cityChoices = useMemo(() => cities.map((c) => c.name), [cities]);
  const citySlug = city.split('/')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const stepValid = (n: number): string => {
    if (n === 1 && !(Number(area) > 0 && Number(price) > 0)) return 'Enter the area (acres) and asking price (₹ Cr).';
    if (n === 2 && !city) return 'Choose the city.';
    if (n === 5 && description.trim().length < 30) return 'Add a description (at least 30 characters). You can write your own or use the assistant.';
    if (n === 6 && phone.replace(/\D/g, '').slice(-10).length !== 10) return 'Enter a 10-digit contact number for buyers.';
    return '';
  };

  const addFiles = (list: FileList | null, kind: 'photo' | 'doc', docName?: string) => {
    if (!list) return;
    const files = Array.from(list);
    if (kind === 'photo') {
      const ok = files.filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type) && f.size <= MAX_PHOTO_MB * 1048576);
      if (ok.length < files.length) setError(`Photos must be JPG, PNG or WebP up to ${MAX_PHOTO_MB} MB.`); else setError('');
      setPhotos((p) => [...p, ...ok].slice(0, MAX_PHOTOS));
    } else {
      const f = files[0];
      if (!f) return;
      if (!/^(application\/pdf|image\/(jpeg|png))$/.test(f.type) || f.size > MAX_DOC_MB * 1048576) { setError(`Documents must be PDF, JPG or PNG up to ${MAX_DOC_MB} MB.`); return; }
      setError('');
      setDocs((d) => d.map((x) => (x.name === docName ? { ...x, file: f } : x)));
    }
  };

  const generate = async () => {
    if (!onGenerateDescription) return;
    setError(''); setGenerating(true);
    const r = await onGenerateDescription({ category, city, microMarket, area: Number(area), price: Number(price), roadWidth, power: powerLoad, zone: zoneType, notes: rawText, tone });
    setGenerating(false);
    if ('error' in r) { setError(r.error); return; }
    setDescription(r.text); setAiSource(r.source);
  };

  const next = async () => {
    const problem = stepValid(step);
    if (problem) { setError(problem); return; }
    setError('');
    if (step === 6) {
      if (!isLoggedIn) { onRequireAuth?.(); return; }
      if (!onSubmitListing) return;
      setSubmitting(true);
      const r = await onSubmitListing(
        { category, listingType, zoneType, area, price, roadWidth, powerLoad, city, microMarket, lat: pin?.lat ?? null, lng: pin?.lng ?? null, rawText, description, docs: features.collectDocuments ? docs.map((d) => ({ name: d.name })) : [], contactPhone: phone },
        { photos, docs: (features.collectDocuments ? docs : []).filter((d) => d.file).map((d) => ({ name: d.name, file: d.file! })) },
      );
      setSubmitting(false);
      if ('error' in r) { setError(r.error); return; }
      setSlug(r.slug);
    }
    go(1);
  };

  const card = 'bg-white rounded-md border border-line p-6 sm:p-8 space-y-5';
  const title = (n: number, text: string) => (
    <h2 className="font-serif-headline text-2xl font-bold text-graphite">Step {flow.indexOf(n) + 1}: {text}</h2>
  );

  return (
    <div id="post-property-flow" className="min-h-screen bg-ivory text-graphite pb-24">
      <div className="bg-white border-b border-line py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-xs font-bold text-clay uppercase font-tabular tracking-wider"><T k="post.eyebrow">Seller & Broker Portal</T></span>
          <h1 className="font-serif-headline text-2xl font-bold"><T k="post.title">Post your land</T></h1>
          <p className="text-xs text-stone mt-1">{features.collectDocuments ? <T k="post.subtitle">Fill in the details, no account needed until the last step. Our team reviews your documents before the listing goes live.</T> : <T k="post.subtitle-nodocs">Fill in the details, no account needed until the last step. Our team reviews every new listing before it goes live.</T>}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ol className="flex flex-wrap gap-2 text-xs font-tabular mb-6">
          {flow.map((id, i) => (
            <li key={id} className={`px-3 py-1 rounded-full ${id === step ? 'paint-graphite text-ivory' : i < flow.indexOf(step) ? 'paint-moss text-ivory' : 'border border-line text-stone'}`}>{i + 1}. {STEPS[id - 1]}</li>
          ))}
        </ol>

        {step === 1 && (
          <div className={card}>
            {title(1, 'Property details')}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>Category</label>
                <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Industrial">Industrial</option><option value="Warehousing">Warehousing & logistics</option>
                  <option value="Commercial">Commercial</option><option value="Residential">Residential plots</option>
                </select></div>
              <div><label className={label}>Listing type</label>
                <select className={field} value={listingType} onChange={(e) => setListingType(e.target.value)}>
                  <option value="Buy">Sale</option><option value="Lease">Lease</option><option value="Rent">Rent</option>
                </select></div>
              <div><label className={label}>Area (acres) *</label><input className={field} type="number" min="0" step="0.01" placeholder="e.g. 3.5" value={area} onChange={(e) => setArea(e.target.value)} /></div>
              <div><label className={label}>Asking price (₹ Crore) *</label><input className={field} type="number" min="0" step="0.01" placeholder="e.g. 4.8" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
              <div><label className={label}>Zone type</label>
                <select className={field} value={zoneType} onChange={(e) => setZoneType(e.target.value)}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select></div>
              <div><label className={label}>Road width / access</label><input className={field} placeholder="e.g. 30 m, 4-lane road" value={roadWidth} onChange={(e) => setRoadWidth(e.target.value)} /></div>
              <div className="sm:col-span-2"><label className={label}>Power / water (if known)</label><input className={field} placeholder="e.g. 33 KV line adjacent, municipal water" value={powerLoad} onChange={(e) => setPowerLoad(e.target.value)} /></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={card}>
            {title(2, 'Location')}
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={label}>City *</label>
                <select className={field} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Select city</option>{cityChoices.map((c) => <option key={c}>{c}</option>)}
                </select></div>
              <div><label className={label}>Area / industrial estate</label><input className={field} placeholder="e.g. Chakan Phase II" value={microMarket} onChange={(e) => setMicroMarket(e.target.value)} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold uppercase font-tabular">Drop a pin on the plot</span>
                <span className="text-stone font-tabular">{pin ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}` : 'Click the map to place the pin'}</span>
              </div>
              <LocationPicker value={pin} onChange={setPin} citySlug={citySlug} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={card}>
            {title(3, 'Documents')}
            <p className="text-xs text-stone">Add the documents you hold and attach a scan of each. They are stored privately: only you and our review team can open them. Listings with more verified documents earn a stronger trust checklist.</p>
            <div className="flex flex-wrap gap-2">
              {DOC_SUGGESTIONS.filter((s) => !docs.some((d) => d.name === s)).map((s) => (
                <button key={s} type="button" onClick={() => setDocs((d) => [...d, { name: s, file: null }])} className="text-xs border border-line rounded-full px-3 py-1 hover:border-graphite">+ {s}</button>
              ))}
            </div>
            <div className="space-y-2">
              {docs.map((d) => (
                <div key={d.name} className="flex flex-wrap items-center justify-between gap-3 border border-line rounded-sm p-3 text-xs">
                  <span className="font-semibold">{d.name}</span>
                  <span className="flex items-center gap-3">
                    {d.file ? <span className="text-moss">✓ {d.file.name}</span> : <span className="text-stone">No file yet</span>}
                    <input type="file" accept=".pdf,image/jpeg,image/png" onChange={(e) => addFiles(e.target.files, 'doc', d.name)} className="text-xs" />
                    <button type="button" onClick={() => setDocs((x) => x.filter((y) => y.name !== d.name))} className="text-clay">Remove</button>
                  </span>
                </div>
              ))}
              {!docs.length && <p className="text-xs text-stone">No documents added yet.</p>}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={card}>
            {title(4, 'Photos')}
            <p className="text-xs text-stone">Up to {MAX_PHOTOS} photos (JPG, PNG or WebP, {MAX_PHOTO_MB} MB each). The first one is the cover.</p>
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => addFiles(e.target.files, 'photo')} className="text-sm" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((f, i) => (
                <div key={f.name + i} className="relative border border-line rounded-sm overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(f)} alt={f.name} className="aspect-[4/3] w-full object-cover" />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-graphite/80 text-ivory text-xs px-2 py-0.5 rounded-sm">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className={card}>
            <div className="flex items-center gap-2"><span className="ai-tag">Assistant</span>{title(5, 'Description')}</div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={label}>Your notes (facts only)</label>
                <textarea rows={8} className={field} placeholder="e.g. corner plot, near the auto cluster, clean 7/12, immediate possession…" value={rawText} onChange={(e) => setRawText(e.target.value)} />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <select value={tone} onChange={(e) => setTone(e.target.value as typeof tone)} className="border border-line rounded-sm px-2 py-1.5">
                    <option value="institutional">Professional</option><option value="concise">Short</option><option value="technical">Specification style</option>
                  </select>
                  <button type="button" onClick={generate} disabled={generating || !onGenerateDescription} className="paint-clay text-ivory font-semibold px-4 py-2 rounded-sm disabled:opacity-50">
                    {generating ? 'Writing…' : description ? 'Regenerate' : 'Generate description'}
                  </button>
                </div>
              </div>
              <div>
                <label className={label}>Listing description {aiSource === 'ai' && <span className="ai-tag ml-2">AI</span>}</label>
                <textarea rows={8} className={field} value={description} onChange={(e) => setDescription(e.target.value)} />
                <p className="text-[11px] text-stone mt-1">The assistant only rephrases what you provide. Please check every fact before submitting.</p>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className={card}>
            {title(6, 'Preview & contact')}
            <div className="border border-line rounded-sm p-5 space-y-2">
              <h3 className="font-serif-headline text-xl font-bold">{area} acre {category.toLowerCase()} land in {microMarket || city}</h3>
              <p className="text-sm text-stone font-tabular">₹{price} Cr · {city} · {zoneType} · {listingType}</p>
              <p className="text-sm">{description}</p>
              <p className="text-xs text-stone">{features.collectDocuments ? `${docs.length} document(s) listed · ` : ''}{photos.length} photo(s) · {pin ? 'map pin set' : 'no map pin'}</p>
            </div>
            <div><label className={label}>Contact number shown to verified buyers *</label>
              <input className={field} inputMode="numeric" placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <p className="text-[11px] text-stone mt-1">It stays hidden until a signed-in buyer unlocks it.</p></div>
            {!isLoggedIn && <p className="text-sm text-clay font-semibold">You&apos;ll be asked to verify your mobile number when you submit.</p>}
          </div>
        )}

        {step === 7 && (
          <div className="bg-white rounded-md border border-line p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full paint-moss text-ivory flex items-center justify-center mx-auto text-2xl">✓</div>
            <h2 className="font-serif-headline text-3xl font-bold">Submitted for review</h2>
            <p className="text-sm text-stone max-w-md mx-auto">Your listing is saved. It goes live only after our team reviews it. Reference: <strong>{slug ?? 'pending'}</strong>. You can track its status on your seller dashboard.</p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <a href="/dashboard/seller" target="_blank" rel="noopener" className="paint-graphite text-ivory text-xs font-semibold px-6 py-2.5 rounded-sm">Open seller dashboard ↗</a>
              <button onClick={() => onNavigate('search')} className="border border-line text-xs font-semibold px-5 py-2.5 rounded-sm">Browse marketplace</button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-sm font-semibold text-clay" role="alert">{error}</p>}
        {step < 7 && (
          <div className="mt-6 flex items-center justify-between">
            <button type="button" onClick={() => { setError(''); go(-1); }} disabled={step === 1} className="px-4 py-2 rounded-sm text-xs font-semibold uppercase border border-line disabled:opacity-30">Back</button>
            <button type="button" onClick={next} disabled={submitting} className="paint-clay text-ivory px-6 py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider disabled:opacity-60">
              {submitting ? 'Submitting…' : step === 6 ? (isLoggedIn ? 'Submit for review' : 'Verify mobile & submit') : 'Next step'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
