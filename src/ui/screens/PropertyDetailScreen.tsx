'use client';
import React, { useState } from 'react';
import { Listing, ScreenId } from '../types';
import { useData } from '../data/DataProvider';
import { AbstractPlotVisual } from '../components/AbstractPlotVisual';
import { CallbackCard, ListingHighlights, ListingLocationMap, ListingSpecs, MobileActionBar } from '../components/ListingExtras';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  MapPin, 
  Share2, 
  Bookmark, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Phone, 
  Mail, 
  Check, 
  TrendingUp, 
  Compass, 
  Car, 
  Clock,
  Layers,
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

interface PropertyDetailScreenProps {
  slug?: string;
  onNavigate: (screen: ScreenId, slug?: string) => void;
  onOpenAuth: () => void;
  isContactUnlocked: boolean;
  onUnlockContact: (listing: Listing) => void;
  /** Fresh listing from the server (preferred over the shared, cached list). */
  listingData?: Listing;
  /** Real owner contact, only present after a successful server-side unlock. */
  contact?: { name: string; phone: string } | null;
  unlocking?: boolean;
  /** Returns an error message, or null on success. */
  onSubmitEnquiry?: (listing: Listing, message: string, visitDate: string) => Promise<string | null>;
  savedIds: string[];
  onToggleSave: (id: string) => void;
}

export const PropertyDetailScreen: React.FC<PropertyDetailScreenProps> = ({
  slug,
  onNavigate,
  onOpenAuth,
  isContactUnlocked,
  onUnlockContact,
  contact,
  listingData,
  unlocking,
  onSubmitEnquiry,
  savedIds,
  onToggleSave,
}) => {
  const { listings: ALL_LISTINGS, features } = useData();
  // Find current listing or fallback
  const listing = listingData ?? ALL_LISTINGS.find((p) => p.slug === slug) ?? ALL_LISTINGS[0];

  // Gallery view tabs
  const [activeGalleryTab, setActiveGalleryTab] = useState<'photos' | 'cadastral' | 'topo' | 'setbacks' | 'highway'>(
    listing.realImageUrl ? 'photos' : 'cadastral'
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const galleryList = listing.galleryImages && listing.galleryImages.length > 0
    ? listing.galleryImages
    : listing.realImageUrl
      ? [listing.realImageUrl]
      : [];
  
  // Expandable Trust items
  const [expandedDocId, setExpandedDocId] = useState<string | null>(listing.documents[0]?.id || null);

  // Enquiry form state
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryCompany, setEnquiryCompany] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('Interested in scheduling a site visit and reviewing the ownership and land documents.');
  const [siteVisitDate, setSiteVisitDate] = useState('2026-09-24');
  const [siteVisitSlot, setSiteVisitSlot] = useState<'Morning (10 AM - 1 PM)' | 'Afternoon (2 PM - 5 PM)'>('Morning (10 AM - 1 PM)');
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);

  const isSaved = savedIds.includes(listing.id);

  const [enquiryError, setEnquiryError] = useState('');
  const [enquirySending, setEnquirySending] = useState(false);
  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnquiryError('');
    if (!onSubmitEnquiry) return;
    setEnquirySending(true);
    const body = `${enquiryMessage}
Slot: ${siteVisitSlot}${enquiryName ? `
Name: ${enquiryName}` : ''}${enquiryCompany ? ` (${enquiryCompany})` : ''}${enquiryPhone ? `
Phone: ${enquiryPhone}` : ''}`;
    const err = await onSubmitEnquiry(listing, body, siteVisitDate);
    setEnquirySending(false);
    if (err) setEnquiryError(err); else setEnquirySubmitted(true);
  };

  const goEnquire = (callback = false) => {
    if (callback) setEnquiryMessage('Please call me back to discuss this listing.');
    document.getElementById('enquiry-schedule-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const others = ALL_LISTINGS.filter((p) => p.id !== listing.id);
  const similarListings = [...others.filter((p) => p.city === listing.city), ...others.filter((p) => p.city !== listing.city)].slice(0, 3);
  const [descOpen, setDescOpen] = useState(false);
  const citySlug = listing.city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const sendCallback = async (d: CallbackDetails) => {
    if (!onSubmitEnquiry) return 'Callback is not available right now.';
    const lines = [
      'Callback request',
      `Name: ${d.name}`,
      `Phone: ${d.phone}`,
      d.email && `Email: ${d.email}`,
      d.area && `Area required: ${d.area} ${d.areaUnit}`,
      d.timeline && `Move-in timeline: ${d.timeline}`,
      d.requirements && `Requirements: ${d.requirements}`,
    ].filter(Boolean);
    return onSubmitEnquiry(listing, lines.join('\n'), new Date().toISOString().slice(0, 10));
  };

  return (
    <div id="property-detail-page" className="min-h-screen bg-ivory text-graphite pb-24">
      
      {/* Top Breadcrumb & Actions Strip */}
      <div className="bg-white border-b border-line py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs font-tabular">
          <div className="flex min-w-0 max-w-full items-center gap-2 text-stone">
            <button 
              onClick={() => onNavigate('search')} 
              className="hover:text-graphite flex items-center gap-1 cursor-pointer font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Search</span>
            </button>
            <span>/</span>
            <a href={`/city/${citySlug}`} className="text-graphite hover:text-clay">{listing.city}</a>
            <span>/</span>
            <span className="text-stone truncate min-w-0 max-w-[110px] sm:max-w-xs">{listing.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(listing.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-xs font-semibold cursor-pointer transition-colors ${
                isSaved 
                  ? 'paint-graphite text-ivory border-graphite' 
                  : 'bg-white text-graphite border-line hover:border-graphite'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-signal" />
              <span>{isSaved ? 'Saved to Dossier' : 'Save Plot'}</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-line bg-white text-xs font-semibold text-graphite hover:border-graphite cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Dossier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Title & Badge Header */}
        <div className="pb-6 border-b border-line">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* AI Match Score Badge (Signal Lime) */}
            {listing.aiMatchScore > 0 && <span className="inline-flex items-center gap-1.5 paint-signal text-graphite font-bold text-xs px-2.5 py-1 rounded-[3px] border border-graphite font-tabular shadow-2xs">
              <Sparkles className="w-3 h-3 text-graphite" />
              <span>{listing.aiMatchScore}% AI Match Score</span>
            </span>}

            {/* Verified Badge (Moss Green) */}
            {(listing.verified || listing.aiScreened) && (
              <span className="inline-flex items-center gap-1 paint-moss text-ivory font-bold text-xs px-2.5 py-1 rounded-[3px] border border-moss font-tabular shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-signal" />
                <span>{listing.verified ? 'DOCUMENTS VERIFIED BY PLOTSS' : 'AI-SCREENED (NOT A LEGAL VERIFICATION)'}</span>
              </span>
            )}

            {/* Price Fairness Indicator (only when a real comparison exists) */}
            {listing.fairnessDelta && <span className="inline-flex items-center gap-1 paint-graphite text-ivory text-xs font-semibold px-2.5 py-1 rounded-[3px] font-tabular">
              <TrendingUp className="w-3 h-3 text-signal" />
              <span>{listing.fairnessRating} ({listing.fairnessDelta})</span>
            </span>}

            <span className="bg-sand text-graphite text-xs font-semibold px-2.5 py-1 rounded-[3px] font-tabular ml-auto">
              ID: {listing.id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <h1 className="font-serif-headline text-2xl sm:text-4xl font-extrabold text-graphite tracking-tight leading-tight">
            {listing.title}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm text-stone font-tabular">
            <MapPin className="w-4 h-4 text-clay shrink-0" />
            <span className="font-semibold text-graphite">{listing.microMarket}, {listing.city}</span>
            <span>•</span>
            <span>{listing.state}</span>
          </div>
        </div>

        {/* 1. IMAGE / PARCEL GALLERY (Real Drone Photography & Cadastral Vector Tabs) */}
        <section className="mt-6 paint-graphite rounded-md border border-ink-4 overflow-hidden shadow-lg">
          {/* Gallery View Mode Selector Bar */}
          <div className="bg-ink-3 border-b border-ink-2 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-tabular">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-mist mr-1 hidden sm:inline font-semibold">View Mode:</span>
              
              {galleryList.length > 0 && (
                <button
                  onClick={() => setActiveGalleryTab('photos')}
                  className={`px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeGalleryTab === 'photos'
                      ? 'paint-clay text-ivory'
                      : 'text-mist hover:text-ivory hover:bg-ink-2'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5 text-signal" />
                  <span>1. Photos ({galleryList.length})</span>
                </button>
              )}

              <button
                onClick={() => setActiveGalleryTab('cadastral')}
                className={`px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeGalleryTab === 'cadastral'
                    ? 'paint-clay text-ivory'
                    : 'text-mist hover:text-ivory hover:bg-ink-2'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>2. 3D outline</span>
              </button>

              <button
                onClick={() => setActiveGalleryTab('topo')}
                className={`px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer ${
                  activeGalleryTab === 'topo'
                    ? 'paint-clay text-ivory'
                    : 'text-mist hover:text-ivory hover:bg-ink-2'
                }`}
              >
                3. Land contours
              </button>

              <button
                onClick={() => setActiveGalleryTab('setbacks')}
                className={`px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer ${
                  activeGalleryTab === 'setbacks'
                    ? 'paint-clay text-ivory'
                    : 'text-mist hover:text-ivory hover:bg-ink-2'
                }`}
              >
                4. Buildable area (FAR {listing.farFsi.split(' ')[0]})
              </button>

              <button
                onClick={() => setActiveGalleryTab('highway')}
                className={`px-3 py-1 rounded-[3px] font-semibold transition-colors cursor-pointer ${
                  activeGalleryTab === 'highway'
                    ? 'paint-clay text-ivory'
                    : 'text-mist hover:text-ivory hover:bg-ink-2'
                }`}
              >
                5. Road access
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-signal">
              <span className="w-2 h-2 rounded-full paint-signal" />
              <span>Outline is indicative, not a survey</span>
            </div>
          </div>

          {/* Active View Display Area */}
          {activeGalleryTab === 'photos' && galleryList.length > 0 ? (
            <div className="relative bg-[var(--c-graphite)]">
              {/* Main Photo Container */}
              <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[560px] overflow-hidden flex items-center justify-center">
                <img
                  src={galleryList[activePhotoIndex]}
                  alt={`${listing.title} - drone view ${activePhotoIndex + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover select-none"
                />

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-graphite/90 via-transparent to-graphite/40 pointer-events-none" />

                {/* Corner Demarcation Wireframe Overlays */}
                <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-ivory/50 rounded-sm pointer-events-none flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="bg-graphite/90 text-ivory px-2 py-1 rounded-[3px] text-[11px] font-tabular border border-ink-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full paint-clay" />
                      <span>Front (Entry)</span>
                    </div>
                    <div className="bg-graphite/90 text-ivory px-2 py-1 rounded-[3px] text-[11px] font-tabular border border-ink-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full paint-clay" />
                      <span>Boundary Wall</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="bg-graphite/90 text-ivory px-2 py-1 rounded-[3px] text-[11px] font-tabular border border-ink-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full paint-signal" />
                      <span>Rear Corner</span>
                    </div>
                    <div className="bg-graphite/90 text-ivory px-2 py-1 rounded-[3px] text-[11px] font-tabular border border-ink-2 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full paint-signal" />
                      <span>Road Side</span>
                    </div>
                  </div>
                </div>

                {/* Left / Right Carousel Arrows */}
                {galleryList.length > 1 && (
                  <>
                    <button
                      onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : galleryList.length - 1))}
                      className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-graphite/80 hover:paint-graphite text-ivory flex items-center justify-center border border-ink-2 shadow-lg cursor-pointer transition-colors"
                      title="Previous Photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActivePhotoIndex((prev) => (prev < galleryList.length - 1 ? prev + 1 : 0))}
                      className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-graphite/80 hover:paint-graphite text-ivory flex items-center justify-center border border-ink-2 shadow-lg cursor-pointer transition-colors"
                      title="Next Photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Floating On-Site Drone Badge */}
                <div className="absolute top-6 left-6 bg-graphite/90 backdrop-blur-xs border border-ink-2 rounded-sm p-3 text-xs text-ivory space-y-1 font-tabular hidden sm:block">
                  <div className="font-bold text-signal flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-signal" />
                    <span>Site photos</span>
                  </div>
                  <div className="text-ivory font-semibold">{listing.title}</div>
                  <div className="text-mist">Captured with high-resolution aerial survey optics</div>
                  <div className="text-mist text-[11px]">Area: {listing.areaDisplay} • Frontage: {listing.frontage}</div>
                </div>

                {/* Photo counter */}
                <div className="absolute bottom-4 right-6 bg-graphite/90 text-ivory px-3 py-1 rounded-sm border border-ink-2 text-xs font-tabular font-semibold">
                  Photo {activePhotoIndex + 1} of {galleryList.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              {galleryList.length > 1 && (
                <div className="bg-[var(--c-graphite)] p-3 border-t border-ink-4 flex items-center gap-3 overflow-x-auto">
                  {galleryList.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-20 sm:w-24 aspect-[16/10] rounded-[3px] overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        activePhotoIndex === idx
                          ? 'border-clay scale-105 shadow-md'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0.5 right-1 text-[11px] text-white font-bold bg-graphite/80 px-1 rounded">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Vector Cadastral / 3D Canvas Render Area */
            <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-[380px] sm:min-h-[460px] paint-graphite relative">
              <AbstractPlotVisual
                variant="hero"
                geometryType={listing.plotGeometryType}
                areaDisplay={listing.areaDisplay}
                roadWidth={listing.roadWidth}
                aiScore={listing.aiMatchScore}
                interactive={true}
              />

              {/* In-view overlay specs */}
              <div className="absolute top-6 left-6 bg-ink-3/90 backdrop-blur-xs border border-ink-2 rounded-sm p-3 text-xs text-ivory space-y-1 font-tabular hidden sm:block">
                <div className="font-bold text-signal">Survey Reference: NCR-2026</div>
                <div className="text-mist">Location: 28.6692°N, 77.4538°E</div>
                <div className="text-mist">Road Frontage: {listing.frontage}</div>
                <div className="text-mist">Power Connection: {listing.powerSanction}</div>
                {activeGalleryTab === 'topo' && (
                  <div className="text-signal text-[11px] pt-1">Land level: gentle slope, natural drainage</div>
                )}
                {activeGalleryTab === 'setbacks' && (
                  <div className="text-clay text-[11px] pt-1">Front Setback: 9.0m • Side: 4.5m • Ground Coverage: 60%</div>
                )}
                {activeGalleryTab === 'highway' && (
                  <div className="text-ivory text-[11px] pt-1">Ingress Lane: 30m Arterial Road with 12m internal boulevard</div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 2. KEY FACTS STRIP (Price, Area, Zone Type, Road Width, Listing Type) */}
        <section 
          id="key-facts-strip"
          className="mt-6 bg-white rounded-sm border border-line p-5 lg:p-6 shadow-xs"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-line">
            
            {/* Price */}
            <div className="pt-2 sm:pt-0 sm:px-4 first:pl-0">
              <span className="text-[11px] uppercase font-bold text-stone font-tabular tracking-wider block">
                {listing.listingType === 'Lease' ? 'Lease Rental' : 'Total Price'}
              </span>
              <div className="text-2xl font-black text-graphite font-tabular mt-0.5">
                {listing.priceDisplay}
              </div>
              <div className="text-xs text-stone font-tabular">
                {listing.pricePerUnit}
              </div>
            </div>

            {/* Area */}
            <div className="pt-4 sm:pt-0 sm:px-4">
              <span className="text-[11px] uppercase font-bold text-stone font-tabular tracking-wider block">
                Total Land Area
              </span>
              <div className="text-2xl font-black text-graphite font-tabular mt-0.5">
                {listing.areaDisplay.split(' ')[0]} {listing.areaUnit}
              </div>
              <div className="text-xs text-stone font-tabular">
                1,30,680 sq.ft (approx)
              </div>
            </div>

            {/* Zone Type */}
            <div className="pt-4 sm:pt-0 sm:px-4">
              <span className="text-[11px] uppercase font-bold text-stone font-tabular tracking-wider block">
                Zoning Classification
              </span>
              <div className="text-base font-bold text-graphite mt-1 leading-snug">
                {listing.zoneType}
              </div>
              <div className="text-xs text-moss font-semibold font-tabular">
                Approved land use
              </div>
            </div>

            {/* Road Width */}
            <div className="pt-4 sm:pt-0 sm:px-4">
              <span className="text-[11px] uppercase font-bold text-stone font-tabular tracking-wider block">
                Road Frontage & Width
              </span>
              <div className="text-base font-bold text-graphite mt-1 leading-snug">
                {listing.roadWidth}
              </div>
              <div className="text-xs text-stone font-tabular">
                {listing.frontage}
              </div>
            </div>

            {/* FAR / FSI */}
            <div className="pt-4 sm:pt-0 sm:px-4">
              <span className="text-[11px] uppercase font-bold text-stone font-tabular tracking-wider block">
                Floor Area Ratio (FAR)
              </span>
              <div className="text-xl font-extrabold text-graphite font-tabular mt-0.5">
                {listing.farFsi.split(' ')[0]} FSI
              </div>
              <div className="text-xs text-stone font-tabular">
                Max Coverage: 60%
              </div>
            </div>

          </div>
        </section>

        {/* 2-Column Main Body: Details & AI Insights vs Contact & Enquiry */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: AI Area Insight, Legal Verification Checklist, Description */}
          <div className="lg:col-span-2 space-y-8">
            
            <ListingHighlights listing={listing} />
            <ListingSpecs listing={listing} />
            <ListingLocationMap listing={listing} />

            {/* 3. AI AREA INSIGHT CARD (Visually distinct with Signal Lime tag) */}
            <div 
              id="ai-area-insight-card"
              className="paint-graphite text-ivory rounded-md border border-ink-2 p-6 shadow-md relative overflow-hidden"
            >
              {/* Lime Highlight Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 paint-signal" />

              <div className="flex items-center justify-between pb-4 border-b border-ink-4">
                <div className="flex items-center gap-2">
                  {/* Signal Lime Tag - Prompt: "Signal Lime used ONLY for AI-related tags/CTAs/match-scores" */}
                  <span className="paint-signal text-graphite font-bold text-[11px] px-2.5 py-1 rounded-[3px] border border-graphite font-tabular uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-graphite" />
                    <span>AI summary</span>
                  </span>
                </div>
                <span className="text-xs text-mist font-tabular">
                  Based on the details provided
                </span>
              </div>

              {/* AI Description */}
              <div className="mt-4">
                <h3 className="font-serif-headline text-lg font-bold text-ivory mb-2">
                  About this land
                </h3>
                <p className={`text-xs sm:text-sm text-line leading-relaxed ${descOpen ? '' : 'line-clamp-4'}`}>
                  {listing.aiDescription}
                </p>
                {listing.aiDescription.length > 260 && (
                  <button type="button" onClick={() => setDescOpen((v) => !v)} className="mt-2 text-xs font-semibold text-signal hover:underline">
                    {descOpen ? 'Show less' : 'Read more →'}
                  </button>
                )}
              </div>

              {/* Connectivity Grid */}
              <div className="mt-6 pt-4 border-t border-ink-4">
                <h4 className="text-xs uppercase font-bold text-signal tracking-wider font-tabular mb-3">
                  Nearby connectivity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-ink-3 p-3 rounded-sm border border-ink-2">
                    <span className="text-mist block text-[11px] uppercase">Highway</span>
                    <span className="font-semibold text-ivory">{listing.connectivity.highway || 'Not provided'}</span>
                  </div>
                  <div className="bg-ink-3 p-3 rounded-sm border border-ink-2">
                    <span className="text-mist block text-[11px] uppercase">Expressway</span>
                    <span className="font-semibold text-ivory">{listing.connectivity.expresswayDistance || 'Not provided'}</span>
                  </div>
                  <div className="bg-ink-3 p-3 rounded-sm border border-ink-2">
                    <span className="text-mist block text-[11px] uppercase">Rail / port distance</span>
                    <span className="font-semibold text-ivory">{listing.connectivity.portOrRailDistance || 'Not provided'}</span>
                  </div>
                  <div className="bg-ink-3 p-3 rounded-sm border border-ink-2">
                    <span className="text-mist block text-[11px] uppercase">Airport</span>
                    <span className="font-semibold text-ivory">{listing.connectivity.airportDistance || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Nearby Industrial Clusters */}
              <div className="mt-5 pt-4 border-t border-ink-4">
                <h4 className="text-xs uppercase font-bold text-signal tracking-wider font-tabular mb-2">
                  Nearby areas within 10 km
                </h4>
                <div className="flex flex-wrap gap-2">
                  {listing.nearbyClusters.map((cluster, i) => (
                    <span 
                      key={i} 
                      className="bg-ink-3 text-ivory text-xs px-2.5 py-1 rounded-[3px] border border-ink-2 font-tabular"
                    >
                      {cluster}
                    </span>
                  ))}
                </div>
              </div>

              {listing.priceHistory.length >= 2 && (
              <div className="mt-5 pt-4 border-t border-ink-4">
                <div className="flex items-center justify-between mb-2 text-xs font-tabular">
                  <span className="text-mist uppercase tracking-wider text-[11px]">
                    Historical Price Trend (₹ Cr / Acre)
                  </span>
                  <span className="text-signal font-semibold">
                    {(((listing.priceHistory[listing.priceHistory.length - 1].pricePerAcre / listing.priceHistory[0].pricePerAcre) - 1) * 100).toFixed(1)}% over {listing.priceHistory.length} years
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-tabular">
                  {listing.priceHistory.map((item) => (
                    <div key={item.year} className="bg-ink-3 p-2 rounded-[3px] border border-ink-2">
                      <span className="text-[11px] text-mist block">{item.year}</span>
                      <span className="font-bold text-xs text-ivory">₹ {item.pricePerAcre.toFixed(2)} Cr</span>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* 4. TRUST & VERIFICATION PANEL (only when documents are collected) */}
            {features.collectDocuments && listing.documents.length > 0 && (
            <div 
              id="trust-verification-panel"
              className="bg-white rounded-md border border-line p-6 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-line">
                <div>
                  <div className="flex items-center gap-2 text-moss text-xs font-bold uppercase tracking-wider font-tabular">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Documents shared by the seller</span>
                  </div>
                  <h3 className="font-serif-headline text-2xl font-bold text-graphite mt-0.5">
                    Document checklist
                  </h3>
                </div>
                <span className="text-xs text-moss bg-ivory px-3 py-1 rounded-sm border border-line font-tabular font-bold w-fit">
                  {listing.documents.length} of {listing.documents.length} Cleared
                </span>
              </div>

              {/* Expandable Document Checklist */}
              <div className="mt-4 divide-y divide-line">
                {listing.documents.map((doc) => {
                  const isExpanded = expandedDocId === doc.id;

                  return (
                    <div key={doc.id} className="py-3.5 transition-all">
                      <button
                        type="button"
                        onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                        className="w-full flex items-center justify-between text-left cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Animated Status Icon */}
                          <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                              isExpanded 
                                ? 'paint-moss text-ivory scale-110' 
                                : 'bg-sand text-moss group-hover:paint-moss group-hover:text-ivory'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-graphite group-hover:text-clay transition-colors">
                                {doc.name}
                              </h4>
                              <span className="paint-moss text-ivory text-[11px] font-bold px-1.5 py-0.2 rounded-[2px] font-tabular">
                                VERIFIED
                              </span>
                            </div>
                            <span className="text-xs text-stone font-tabular">
                              {doc.category} • Certified on {doc.verifiedDate}
                            </span>
                          </div>
                        </div>

                        <div className="p-1 text-stone group-hover:text-graphite">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>

                      {/* Expandable Details Container */}
                      {isExpanded && (
                        <div className="mt-3 pl-9 pr-2 space-y-2 text-xs text-stone animate-in fade-in duration-200">
                          <p className="bg-ivory p-3 rounded-sm border border-line leading-relaxed text-graphite">
                            {doc.description}
                          </p>
                          <div className="flex items-center justify-between text-[11px] font-tabular text-stone pt-1">
                            <span>Document Ref No: <strong className="text-graphite">{doc.documentRef}</strong></span>
                            <span className="text-moss font-semibold">✓ Authenticated via State Revenue Database</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            )}
          </div>

          {/* RIGHT COLUMN: Contact Section & Enquiry Form */}
          <div className="space-y-6">
            <CallbackCard onSubmit={sendCallback} />

            {/* 5. CONTACT SECTION (Masked vs Unlocked) */}
            <div 
              id="property-contact-box"
              className="bg-white rounded-md border border-line p-6 shadow-xs"
            >
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <span className="text-xs font-bold text-trust uppercase tracking-wider font-tabular">
                  Owner / Mandated Broker
                </span>
                <span className="bg-sand text-graphite text-[11px] font-bold px-2 py-0.5 rounded-[2px] font-tabular">
                  {listing.ownerType}
                </span>
              </div>

              {isContactUnlocked ? (
                /* Unlocked State */
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-moss font-bold font-tabular">
                    <Unlock className="w-4 h-4" />
                    <span>Direct Access Unlocked</span>
                  </div>

                  <div>
                    <h4 className="font-serif-headline text-lg font-bold text-graphite">
                      {contact?.name ?? listing.ownerFullName}
                    </h4>
                    <p className="text-xs text-stone">
                      Official listing representative
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 text-xs font-tabular">
                    <div className="flex items-center gap-2 p-2 bg-ivory rounded-sm border border-line">
                      <Phone className="w-4 h-4 text-clay" />
                      <a href={`tel:${contact?.phone ?? listing.ownerPhone}`} className="font-bold text-graphite hover:underline">
                        {contact?.phone ?? listing.ownerPhone}
                      </a>
                    </div>
                  </div>

                  {listing.brokerId && (
                    <button
                      onClick={() => onNavigate('broker_profile')}
                      className="w-full text-center text-xs text-clay font-semibold underline cursor-pointer pt-1"
                    >
                      View Broker Credentials & Full Portfolio →
                    </button>
                  )}
                </div>
              ) : (
                /* Masked State with Unlock Button */
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-ivory rounded-sm border border-line space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-stone">
                      <Lock className="w-3.5 h-3.5 text-clay" />
                      <span>Contact Representative:</span>
                    </div>
                    <div className="font-tabular text-sm font-bold text-graphite">
                      {listing.ownerMaskedName}
                    </div>
                    <div className="font-tabular text-xs text-stone">
                      Phone: {listing.ownerMaskedPhone}
                    </div>
                  </div>

                  {/* Mandated Button: Clicking opens login/signup modal */}
                  <button
                    id="unlock-contact-btn"
                    type="button"
                    onClick={() => onUnlockContact(listing)}
                    className="w-full paint-graphite hover:paint-clay text-ivory text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm font-tabular"
                  >
                    <Lock className="w-3.5 h-3.5 text-signal" />
                    <span>{unlocking ? 'Unlocking…' : 'Unlock Contact Details'}</span>
                  </button>

                  <p className="text-[11px] text-stone text-center leading-tight">
                    Instant verification via Google or email. No registration fee.
                  </p>
                </div>
              )}
            </div>

            {/* 6. ENQUIRY & SCHEDULE SITE VISIT FORM */}
            <div 
              id="enquiry-schedule-form"
              className="bg-white rounded-md border border-line p-6 shadow-xs"
            >
              <div className="pb-3 border-b border-line">
                <h3 className="font-serif-headline text-lg font-bold text-graphite">
                  Schedule a Site Visit
                </h3>
                <p className="text-xs text-stone">
                  Walk the plot with the owner before you decide
                </p>
              </div>

              {enquirySubmitted ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full paint-moss text-ivory flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif-headline text-base font-bold text-graphite">
                    Site Inspection Request Confirmed
                  </h4>
                  <p className="text-xs text-stone leading-relaxed">
                    Our surveyor has reserved <strong>{siteVisitDate}</strong> ({siteVisitSlot}). You will receive confirmation on your registered phone.
                  </p>
                  <button
                    onClick={() => setEnquirySubmitted(false)}
                    className="text-xs text-clay underline font-semibold cursor-pointer"
                  >
                    Modify Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEnquirySubmit} className="mt-4 space-y-3 text-xs">
                  <button type="button" onClick={() => setEnquiryMessage('Please call me back to discuss this listing.')} className="w-full rounded-sm border border-line py-2 text-xs font-semibold text-clay hover:border-clay">
                    Request a callback instead
                  </button>
                  <div>
                    <label className="block font-semibold text-graphite mb-1">
                      Preferred Inspection Date
                    </label>
                    <input
                      type="date"
                      value={siteVisitDate}
                      onChange={(e) => setSiteVisitDate(e.target.value)}
                      className="w-full bg-ivory text-xs font-tabular text-graphite p-2 rounded-sm border border-line focus:outline-none focus:border-graphite"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite mb-1">
                      Inspection Time Slot
                    </label>
                    <select
                      value={siteVisitSlot}
                      onChange={(e) => setSiteVisitSlot(e.target.value as any)}
                      className="w-full bg-ivory text-xs font-tabular text-graphite p-2 rounded-sm border border-line focus:outline-none focus:border-graphite"
                    >
                      <option value="Morning (10 AM - 1 PM)">Morning (10:00 AM - 1:00 PM)</option>
                      <option value="Afternoon (2 PM - 5 PM)">Afternoon (2:00 PM - 5:00 PM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-graphite mb-1">
                      Notes or questions
                    </label>
                    <textarea
                      rows={3}
                      value={enquiryMessage}
                      onChange={(e) => setEnquiryMessage(e.target.value)}
                      className="w-full bg-ivory text-xs text-graphite p-2 rounded-sm border border-line focus:outline-none focus:border-graphite"
                    />
                  </div>

                  <button
                    id="submit-enquiry-btn"
                    type="submit"
                    className="w-full paint-clay hover:bg-clay-dark text-ivory py-2.5 rounded-sm font-semibold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    {enquirySending ? 'Sending…' : 'Confirm Inspection Schedule'}
                  </button>
                  {enquiryError && <p className="text-clay text-xs font-semibold" role="alert">{enquiryError}</p>}
                </form>
              )}
            </div>

          </div>

        </div>

        {/* 7. SIMILAR LISTINGS CAROUSEL */}
        <section className="mt-16 pt-8 border-t border-line">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold text-trust uppercase tracking-wider font-tabular">
                You may also like
              </span>
              <h3 className="font-serif-headline text-2xl font-bold text-graphite mt-0.5">
                Similar listings in {listing.city} and nearby
              </h3>
            </div>
            <button
              onClick={() => onNavigate('search')}
              className="text-xs font-semibold text-graphite hover:text-clay flex items-center gap-1 cursor-pointer font-tabular"
            >
              <span>Explore All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {similarListings.map((plot) => (
              <div
                key={plot.id}
                onClick={() => onNavigate('property_detail', plot.slug)}
                className="bg-white rounded-sm border border-line hover:border-graphite p-4 transition-all cursor-pointer group shadow-xs hover:shadow-md"
              >
                <div className="h-32 rounded-[3px] overflow-hidden mb-3">
                  <AbstractPlotVisual
                    variant="card"
                    geometryType={plot.plotGeometryType}
                    areaDisplay={plot.areaDisplay}
                    roadWidth={plot.roadWidth}
                    aiScore={plot.aiMatchScore}
                  />
                </div>

                <div className="text-xs text-stone font-tabular">
                  {plot.city} • {plot.microMarket}
                </div>
                <h4 className="font-serif-headline text-base font-bold text-graphite group-hover:text-clay transition-colors mt-1 line-clamp-2">
                  {plot.title}
                </h4>

                <div className="mt-3 pt-2 border-t border-line flex items-center justify-between">
                  <span className="text-base font-bold text-graphite font-tabular">
                    {plot.priceDisplay}
                  </span>
                  <span className="text-xs font-semibold text-clay flex items-center gap-0.5">
                    View Dossier →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <MobileActionBar
        listing={listing}
        unlocked={isContactUnlocked}
        phone={contact?.phone}
        unlocking={unlocking}
        onUnlock={() => onUnlockContact(listing)}
        onEnquire={() => goEnquire()}
      />
    </div>
  );
};
