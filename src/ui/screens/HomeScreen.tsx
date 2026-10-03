'use client';
import { T, Show } from '../content';
import Link from 'next/link';
import React, { useState } from 'react';
import { Listing, CityInfo, ScreenId } from '../types';
import { useData } from '../data/DataProvider';
import { AbstractPlotVisual } from '../components/AbstractPlotVisual';
import { IndiaMap, type MapCity } from '../components/IndiaMap';
import { mapsHref } from '@/lib/geo';

/** Approximate city-centre coordinates for the launch cities' map pins. */
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Ghaziabad: { lat: 28.6692, lng: 77.4538 },
  Noida: { lat: 28.5355, lng: 77.391 },
  'New Delhi': { lat: 28.6139, lng: 77.209 },
};
import {
  Sparkles,
  Search,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Factory,
  Building,
  Home,
  Warehouse,
  CheckCircle2,
  TrendingUp,
  Compass,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronRight,
  FileCheck2,
  Lock,
  Heart,
  Map as MapIcon
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (screen: ScreenId, slug?: string) => void;
  onSearchQuerySubmit: (query: string, filterType?: 'Buy' | 'Lease' | 'Rent') => void;
  onSelectListing: (slug: string) => void;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  onAddToCompare: (listing: Listing) => void;
  comparedIds: string[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSearchQuerySubmit,
  onSelectListing,
  savedIds,
  onToggleSave,
  onAddToCompare,
  comparedIds,
}) => {
  const { listings, cities, blog, stats, categoryCounts, features } = useData();
  const [activeTab, setActiveTab] = useState<'Buy' | 'Lease' | 'Rent'>('Buy');
  const [naturalQuery, setNaturalQuery] = useState('');
  const [hoveredContactId, setHoveredContactId] = useState<string | null>(null);

  // Prime micro-markets: computed from live listings, not hard-coded, so they always match real inventory.
  const primeDistricts = React.useMemo(() => {
    const byHub = new Map<string, { city: string; count: number }>();
    for (const l of listings) {
      if (!l.microMarket) continue;
      const cur = byHub.get(l.microMarket);
      if (cur) cur.count += 1; else byHub.set(l.microMarket, { city: l.city, count: 1 });
    }
    return [...byHub.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [listings]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchQuerySubmit(naturalQuery || '3 acre industrial land near Ghaziabad under 5Cr', activeTab);
  };

  const mapCities: MapCity[] = cities.reduce<MapCity[]>((acc, c) => {
    const coord = CITY_COORDS[c.name];
    if (coord) acc.push({ slug: c.name.toLowerCase().replace(/\s+/g, '-'), name: c.name, state: c.state, lat: coord.lat, lng: coord.lng, plotCount: c.plotCount });
    return acc;
  }, []);

  const sampleSearchPrompts = [
    '3 acre industrial land near Ghaziabad under 5Cr',
    'Warehousing land near Narela or Bawana with truck access',
    'Industrial plot in Greater Noida near Ecotech under 10Cr',
    'Commercial parcel on the Noida Expressway'
  ];

  return (
    <div id="homepage-root" className="min-h-screen bg-ivory text-graphite">
      
      {/* 1. HERO SECTION (Full-Bleed with 3D Abstract Land Geometry Background & AI Natural Language Search) */}
      <section className="relative w-full border-b border-line pt-12 pb-16 lg:pt-16 lg:pb-20 overflow-hidden">
        {/* Soft ambient glow — graphite-to-trust radial wash behind the headline, subtle not a flashy SaaS gradient */}
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full paint-trust opacity-10 blur-3xl pointer-events-none z-0" aria-hidden="true" />
        <div className="absolute left-1/3 top-1/2 h-72 w-72 rounded-full paint-clay opacity-[0.07] blur-3xl pointer-events-none z-0" aria-hidden="true" />
        {/* Abstract 3D Geometric Land Graphic Layer */}
        <div className="absolute top-0 right-0 w-full lg:w-3/5 h-full opacity-20 md:opacity-40 lg:opacity-100 pointer-events-none z-0 flex items-center justify-end">
          <AbstractPlotVisual variant="hero" interactive={true} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="max-w-2xl">
            {/* Top Brand Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm paint-trust text-ivory text-xs font-semibold uppercase tracking-wider mb-6 font-tabular">
              <span className="w-2 h-2 rounded-full paint-signal" />
              <span>India's AI Land & Industrial Exchange</span>
            </div>

            {/* Editorial Headline in Fraunces Serif */}
            <h1 className="font-serif-headline text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-graphite leading-[1.08]">
              <T k="home.hero-title">Find Industrial &amp; Commercial Land in Ghaziabad, Noida and New Delhi.</T>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-stone leading-relaxed max-w-xl">
              <T k="home.hero-subtitle">Buy, lease or sell industrial, commercial and residential land in Ghaziabad, Noida and New Delhi. Describe what you need in plain language and we show matching listings.</T>
            </p>

            {/* AI Search Box with Quick-Filter Tabs */}
            <div className="mt-8 bg-ivory border border-graphite rounded-md shadow-lg p-2 sm:p-2.5">
              
              {/* Quick-Filter Tabs (Buy / Lease / Rent) above search input */}
              <div className="flex items-center gap-1 mb-2 border-b border-line pb-2">
                {(['Buy', 'Lease', 'Rent'] as const).map((tab) => (
                  <button
                    key={tab}
                    id={`hero-tab-${tab.toLowerCase()}`}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-sm text-xs font-semibold font-tabular uppercase tracking-wider transition-colors cursor-pointer ${
                      activeTab === tab
                        ? 'paint-graphite text-ivory'
                        : 'text-stone hover:text-graphite hover:bg-sand'
                    }`}
                  >
                    {tab} Land
                  </button>
                ))}
                <span className="ml-auto text-[11px] text-stone font-tabular hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-signal fill-signal" />
                  <T k="home.natural-language-parser-active">Natural-Language Parser Active</T>
                </span>
              </div>

              {/* Natural Language Query Input Form */}
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-stone" />
                  <input
                    id="hero-natural-search-input"
                    type="text"
                    value={naturalQuery}
                    onChange={(e) => setNaturalQuery(e.target.value)}
                    placeholder="Describe what you need — e.g. '3 acre industrial land near Ghaziabad under 5Cr'"
                    className="w-full bg-white text-sm text-graphite placeholder-stone/75 pl-9 pr-3 py-3 rounded-sm border border-line focus:outline-none focus:border-graphite"
                  />
                </div>

                <button
                  id="hero-search-submit-btn"
                  type="submit"
                  className="paint-signal hover:paint-signal text-graphite font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-sm border border-graphite transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-graphite" />
                  <span>Parse with AI</span>
                </button>
              </form>

              {/* Quick sample prompt pills */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px] text-stone">
                <span className="font-semibold text-graphite">Try prompts:</span>
                {sampleSearchPrompts.slice(0, 2).map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNaturalQuery(prompt);
                      onSearchQuerySubmit(prompt, activeTab);
                    }}
                    className="bg-sand hover:bg-line text-graphite px-2 py-0.5 rounded-[3px] transition-colors cursor-pointer border border-line truncate max-w-[280px]"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1b. PRIME DISTRICTS (Micro-market tiles computed from live inventory — jump straight to an area) */}
      {primeDistricts.length > 0 && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <span className="text-xs font-bold text-trust uppercase tracking-wider font-tabular">
            <T k="home.prime-districts-eyebrow">Prime Micro-Markets</T>
          </span>
          <h2 className="font-serif-headline text-2xl sm:text-3xl font-bold text-graphite mt-1">
            <T k="home.prime-districts-title">Jump straight to an area</T>
          </h2>
          <p className="mt-1 text-sm text-stone">
            <T k="home.prime-districts-subtitle">The corridors buyers search for most, right now.</T>
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {primeDistricts.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => onSearchQuerySubmit(d.name, 'Buy')}
              className="text-left bg-white rounded-sm border border-line p-4 hover:border-clay transition-colors cursor-pointer group"
            >
              <span className="text-[11px] text-stone font-semibold uppercase tracking-wide font-tabular">{d.city}</span>
              <div className="mt-1 font-serif-headline text-base font-bold text-graphite group-hover:text-clay transition-colors truncate">{d.name}</div>
              <div className="mt-1 text-xs text-stone font-tabular">{d.count} {d.count === 1 ? 'listing' : 'listings'}</div>
            </button>
          ))}
        </div>
      </section>
      )}

      {/* 2. LIVE STATS TICKER STRIP (Immediately below hero, thin horizontal band) */}
      <div 
        id="live-stats-ticker"
        className="w-full paint-graphite text-ivory border-b border-ink-4 py-3 font-tabular"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs tracking-wide">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full paint-signal animate-pulse" />
            <span className="font-bold text-ivory">{stats.plots} {features.humanReview ? <T k="home.stats.plots-label">Verified Plots</T> : <T k="home.stats.plots-label-all">Live Listings</T>}</span>
            <span className="text-stone">•</span>
            <span className="font-bold text-ivory">{stats.cities} <T k="home.stats.cities-label">Cities</T></span>
            <span className="text-stone">•</span>
            <span className="font-bold text-ivory">{stats.deals} <T k="home.stats.deals-label">Deals Closed</T></span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-mist text-[11px]">
            <span><T k="home.ticker-note">New listings are screened before they go live</T></span>
            <span>•</span>
            <span className="text-signal">Contact details unlock after sign-in</span>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY CARDS (Industrial / Commercial / Residential / Warehousing) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-trust uppercase tracking-wider font-tabular">
              <T k="home.zoning-asset-classes">Zoning & Asset Classes</T>
            </span>
            <h2 className="font-serif-headline text-3xl font-bold text-graphite mt-1">
              <T k="home.explore-by-land-classification">Explore by Land Classification</T>
            </h2>
          </div>
          <button
            onClick={() => onNavigate('search')}
            className="mt-2 sm:mt-0 text-xs font-semibold text-graphite hover:text-clay flex items-center gap-1 cursor-pointer"
          >
            <span>View All Classifications</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Industrial Card */}
          <div 
            id="cat-card-industrial"
            onClick={() => onSearchQuerySubmit('industrial', 'Buy')}
            className="group bg-white rounded-sm border border-line p-5 hover:border-graphite transition-all cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-sm paint-graphite text-signal flex items-center justify-center mb-4 group-hover:paint-clay group-hover:text-ivory transition-colors">
              <Factory className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif-headline text-xl font-bold text-graphite">Industrial Land</h3>
              <span className="text-xs font-bold font-tabular text-stone bg-sand px-2 py-0.5 rounded-[3px]">
                {categoryCounts.Industrial ?? 0} Plots
              </span>
            </div>
            <p className="mt-2 text-xs text-stone leading-relaxed">
              <T k="home.cat-industrial">Industrial plots and land with power, road access and zoning details.</T>
            </p>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-graphite group-hover:text-clay">
              <span>Explore Industrial</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Warehousing Card */}
          <div 
            id="cat-card-warehousing"
            onClick={() => onSearchQuerySubmit('warehousing', 'Lease')}
            className="group bg-white rounded-sm border border-line p-5 hover:border-graphite transition-all cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-sm paint-graphite text-signal flex items-center justify-center mb-4 group-hover:paint-clay group-hover:text-ivory transition-colors">
              <Warehouse className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif-headline text-xl font-bold text-graphite">Warehousing & 3PL</h3>
              <span className="text-xs font-bold font-tabular text-stone bg-sand px-2 py-0.5 rounded-[3px]">
                {categoryCounts.Warehousing ?? 0} Listings
              </span>
            </div>
            <p className="mt-2 text-xs text-stone leading-relaxed">
              <T k="home.cat-warehousing">Logistics and warehousing land near highways and freight corridors.</T>
            </p>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-graphite group-hover:text-clay">
              <span>Explore Warehousing</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Commercial Card */}
          <div 
            id="cat-card-commercial"
            onClick={() => onSearchQuerySubmit('commercial', 'Buy')}
            className="group bg-white rounded-sm border border-line p-5 hover:border-graphite transition-all cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-sm paint-graphite text-signal flex items-center justify-center mb-4 group-hover:paint-clay group-hover:text-ivory transition-colors">
              <Building className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif-headline text-xl font-bold text-graphite">Commercial IT/SEZ</h3>
              <span className="text-xs font-bold font-tabular text-stone bg-sand px-2 py-0.5 rounded-[3px]">
                {categoryCounts.Commercial ?? 0} Sites
              </span>
            </div>
            <p className="mt-2 text-xs text-stone leading-relaxed">
              <T k="home.cat-commercial">Commercial and mixed-use land listings for offices, retail and campuses.</T>
            </p>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-graphite group-hover:text-clay">
              <span>Explore Commercial</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Residential NA Card */}
          <div 
            id="cat-card-residential"
            onClick={() => onSearchQuerySubmit('residential', 'Buy')}
            className="group bg-white rounded-sm border border-line p-5 hover:border-graphite transition-all cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="w-10 h-10 rounded-sm paint-graphite text-signal flex items-center justify-center mb-4 group-hover:paint-clay group-hover:text-ivory transition-colors">
              <Home className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-serif-headline text-xl font-bold text-graphite">Residential NA Plots</h3>
              <span className="text-xs font-bold font-tabular text-stone bg-sand px-2 py-0.5 rounded-[3px]">
                {categoryCounts.Residential ?? 0} Plots
              </span>
            </div>
            <p className="mt-2 text-xs text-stone leading-relaxed">
              <T k="home.cat-residential">Residential plots and plotted developments in growth corridors.</T>
            </p>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-graphite group-hover:text-clay">
              <span>Explore Residential</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. FEATURED / SIGNATURE LISTINGS (Grid with AI Match Score, Verified Badge & Abstract Plot Visual) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full paint-signal" />
              <span className="text-xs font-bold text-graphite uppercase tracking-wider font-tabular">
                <T k="home.ai-signature-selections">AI Signature Selections</T>
              </span>
            </div>
            <h2 className="font-serif-headline text-3xl font-bold text-graphite mt-1">
              <T k="home.featured-title">Featured Land Listings</T>
            </h2>
          </div>
          <button
            id="featured-view-all-btn"
            onClick={() => onNavigate('search')}
            className="mt-2 sm:mt-0 inline-flex items-center gap-2 paint-graphite hover:paint-clay text-ivory text-xs font-semibold px-4 py-2 rounded-sm transition-colors cursor-pointer font-tabular"
          >
            <span>View All {stats.plots} Listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3-Column Listing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.slice(0, 3).map((plot) => {
            const isCompared = comparedIds.includes(plot.id);
            const isSaved = savedIds.includes(plot.id);
            return (
              <div
                key={plot.id}
                id={`featured-card-${plot.id}`}
                className="group bg-white rounded-sm border border-line hover:border-graphite transition-all overflow-hidden flex flex-col cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5"
                onClick={() => onSelectListing(plot.slug)}
              >
                {/* Visual Thumbnail: Real Drone Photo or Abstract 3D Geometric Plot Model */}
                <div className="relative">
                  <AbstractPlotVisual
                    variant="card"
                    geometryType={plot.plotGeometryType}
                    areaDisplay={plot.areaDisplay}
                    roadWidth={plot.roadWidth}
                    aiScore={plot.aiMatchScore}
                    realImageUrl={plot.realImageUrl}
                    category={plot.category}
                  />

                  {/* Verified Badge (Moss Green var(--c-moss)) */}
                  {(plot.verified || plot.aiScreened) && (
                    <div className={`absolute ${plot.realImageUrl ? 'top-9 left-2.5' : 'top-2.5 left-2.5'} z-10 paint-moss text-ivory text-[11px] font-semibold px-2 py-0.5 rounded-[3px] border border-ink-2 flex items-center gap-1 font-tabular shadow-sm`}>
                      <ShieldCheck className="w-3 h-3 text-signal" />
                      <span>{plot.verified ? 'DOCS VERIFIED' : 'AI-SCREENED'}</span>
                    </div>
                  )}

                  {/* Category Pill */}
                  <div className="absolute bottom-7 right-2.5 z-10 bg-graphite/95 text-ivory text-[11px] font-medium px-2 py-0.5 rounded-[3px] border border-ink-4 font-tabular">
                    {plot.zoneType}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Location & Micro-Market */}
                    <div className="flex items-center gap-1 text-xs text-stone font-tabular mb-1.5">
                      <MapPin className="w-3.5 h-3.5 text-clay shrink-0" />
                      <span className="font-semibold text-graphite">{plot.city}</span>
                      <span>•</span>
                      <span className="truncate">{plot.microMarket}</span>
                    </div>

                    {/* Listing Title */}
                    <h3 className="font-serif-headline text-lg font-bold text-graphite group-hover:text-clay transition-colors leading-snug line-clamp-2">
                      {plot.title}
                    </h3>

                    {/* Area & Road Frontage Grid */}
                    <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-line text-xs font-tabular">
                      <div>
                        <span className="text-stone block text-[11px] uppercase">Plot Area</span>
                        <span className="font-bold text-graphite">{plot.areaDisplay}</span>
                      </div>
                      <div>
                        <span className="text-stone block text-[11px] uppercase">Road Frontage</span>
                        <span className="font-semibold text-graphite truncate block">{plot.frontage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price & Actions Strip */}
                  <div className="pt-3 border-t border-line flex items-end justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-stone block font-tabular">
                        {plot.listingType === 'Lease' ? 'Lease Rental' : 'Total Acquisition'}
                      </span>
                      <div className="text-xl font-extrabold text-graphite font-tabular leading-tight">
                        {plot.priceDisplay}
                      </div>
                      <div className="text-[11px] text-stone font-tabular">
                        {plot.pricePerUnit}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={mapsHref(plot)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`View ${plot.title} on the map`}
                        title="View on map"
                        className="grid h-8 w-8 place-items-center rounded-sm border border-line bg-ivory text-graphite transition-colors hover:border-graphite"
                      >
                        <MapIcon className="h-4 w-4" />
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleSave(plot.id);
                        }}
                        aria-label={isSaved ? `Remove ${plot.title} from saved` : `Save ${plot.title}`}
                        aria-pressed={isSaved}
                        title={isSaved ? 'Saved' : 'Save'}
                        className={`grid h-8 w-8 place-items-center rounded-sm border transition-colors cursor-pointer ${
                          isSaved ? 'paint-clay border-clay text-ivory' : 'bg-ivory text-graphite border-line hover:border-graphite'
                        }`}
                      >
                        <Heart className="h-4 w-4" fill={isSaved ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCompare(plot);
                        }}
                        className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors cursor-pointer ${
                          isCompared
                            ? 'paint-graphite text-signal border-graphite'
                            : 'bg-ivory text-graphite border-line hover:border-graphite'
                        }`}
                      >
                        {isCompared ? '✓ Compared' : '+ Compare'}
                      </button>
                    </div>
                  </div>

                  {/* Masked Contact preview on card hover */}
                  <div 
                    className="pt-2 border-t border-dashed border-line flex items-center justify-between text-[11px] text-stone"
                    onMouseEnter={() => setHoveredContactId(plot.id)}
                    onMouseLeave={() => setHoveredContactId(null)}
                  >
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3 h-3 text-clay" />
                      <span className="font-tabular font-medium text-graphite">
                        {plot.ownerMaskedName}
                      </span>
                      <span>•</span>
                      <span className="font-tabular">{plot.ownerMaskedPhone}</span>
                    </div>
                    <span className="text-[11px] text-clay font-semibold underline">
                      <T k="home.unlock-details">Unlock Details</T>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5a. INTERACTIVE MAP — hover a pin for its listing count, click to jump into that city's search */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <IndiaMap cities={mapCities} onSelectCity={(c) => onSearchQuerySubmit(c.name, 'Buy')} />
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-xs font-bold text-trust uppercase tracking-wider font-tabular">
              <T k="home.featured-across-ncr">Featured Across NCR</T>
            </span>
            <h2 className="font-serif-headline text-3xl font-bold text-graphite mt-1">
              <T k="home.top-destinations-title">Our Launch Markets</T>
            </h2>
            <p className="mt-2 text-sm text-stone max-w-md">
              <T k="home.top-destinations-subtitle">Hover a pin to see live listing counts, or jump straight to a city below.</T>
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => onSearchQuerySubmit(city.name, 'Buy')}
                  className="flex items-center justify-between rounded-md border border-line bg-white p-4 text-left hover:border-graphite transition-colors cursor-pointer group"
                >
                  <div>
                    <div className="font-serif-headline font-bold text-graphite group-hover:text-clay transition-colors">{city.name}</div>
                    <div className="text-xs text-stone mt-0.5">{city.plotCount} {city.plotCount === 1 ? 'listing' : 'listings'}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-clay shrink-0" />
                </button>
              ))}
            </div>
            <Link href="/city" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-clay hover:underline">
              <T k="home.browse-all-cities">Browse all cities</T> <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5b. EXPLORE BY CITY (detailed cards: avg price, popular hubs) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-8">
          <span className="text-xs font-bold text-trust uppercase tracking-wider font-tabular">
            <T k="home.geographic-coverage">Geographic Coverage</T>
          </span>
          <h2 className="font-serif-headline text-3xl font-bold text-graphite mt-1">
            <T k="home.cities-title">Explore Our Launch Cities</T>
          </h2>
          <p className="mt-1 text-sm text-stone">
            <T k="home.cities-subtitle">Land listings across Ghaziabad, Noida and New Delhi.</T>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cities.map((city) => (
            <div
              key={city.name}
              onClick={() => onSearchQuerySubmit(city.name, 'Buy')}
              className="bg-white rounded-sm border border-line p-4 hover:border-graphite transition-all cursor-pointer group shadow-xs hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-clay font-semibold uppercase font-tabular">
                  {city.state}
                </span>
                <span className="text-xs font-bold text-graphite bg-sand px-2 py-0.5 rounded-[3px] font-tabular">
                  {city.plotCount} Plots
                </span>
              </div>
              <h3 className="font-serif-headline text-xl font-bold text-graphite mt-2 group-hover:text-clay transition-colors">
                {city.name}
              </h3>
              <div className="mt-2 text-xs text-stone font-tabular">
                Avg: <strong className="text-graphite">{city.avgPricePerAcre}</strong> / Acre
              </div>
              <div className="mt-3 pt-2 border-t border-line text-[11px] text-stone truncate">
                Hubs: {city.popularHubs.slice(0, 2).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. HOW IT WORKS (Numbered Horizontal Timeline: Search → Verify → Connect → Close) */}
      <section className="relative overflow-hidden paint-graphite text-ivory py-16 border-y border-ink-4">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full paint-trust opacity-20 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute left-1/4 bottom-0 h-64 w-64 rounded-full paint-clay opacity-10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold text-signal uppercase tracking-wider font-tabular">
              <T k="home.institutional-protocol">Institutional Protocol</T>
            </span>
            <h2 className="font-serif-headline text-3xl sm:text-4xl font-bold text-ivory mt-1">
              <T k="home.how-plotss-accelerates-land-acquisition">How PLOTSS Accelerates Land Acquisition</T>
            </h2>
            <p className="mt-2 text-sm text-mist">
              <T k="home.how-subtitle">One place to search, shortlist and reach owners directly. New listings are screened before they go live.</T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="p-5 bg-ink-3 rounded-sm border border-ink-2 flex flex-col justify-between relative">
              <div className="text-2xl font-extrabold text-signal font-tabular mb-4">
                01.
              </div>
              <div>
                <h3 className="font-serif-headline text-lg font-bold text-ivory">
                  <T k="home.natural-language-search">Natural-Language Search</T>
                </h3>
                <p className="mt-2 text-xs text-mist leading-relaxed">
                  <T k="home.query-by-required-acreage-power-substation">Query by required acreage, power substation load, 40-foot trailer road frontage, or target budget in plain language.</T>
                </p>
              </div>
              <div className="mt-4 text-[11px] text-signal font-tabular font-semibold">
                <T k="home.ai-match-algorithm">AI Match Algorithm →</T>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 bg-ink-3 rounded-sm border border-ink-2 flex flex-col justify-between relative">
              <div className="text-2xl font-extrabold text-signal font-tabular mb-4">
                02.
              </div>
              <div>
                <h3 className="font-serif-headline text-lg font-bold text-ivory">
                  <T k="home.how-step2-title">Screened Listings</T>
                </h3>
                <p className="mt-2 text-xs text-mist leading-relaxed">
                  <T k="home.how-step2-text">Every new listing is checked for red flags before it is published. Ask the owner for papers when you meet, and have your lawyer verify them.</T>
                </p>
              </div>
              <div className="mt-4 text-[11px] text-moss bg-ivory px-2 py-0.5 rounded-[3px] font-tabular font-bold w-fit">
                ✓ Documents reviewed
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 bg-ink-3 rounded-sm border border-ink-2 flex flex-col justify-between relative">
              <div className="text-2xl font-extrabold text-signal font-tabular mb-4">
                03.
              </div>
              <div>
                <h3 className="font-serif-headline text-lg font-bold text-ivory">
                  <T k="home.how-step3-title">Contact the Owner</T>
                </h3>
                <p className="mt-2 text-xs text-mist leading-relaxed">
                  <T k="home.how-step3-text">Sign in to unlock the owner's phone number. Speak directly and arrange a site visit.</T>
                </p>
              </div>
              <div className="mt-4 text-[11px] text-mist font-tabular">
                <T k="home.how-step3-tag">Direct contact →</T>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 bg-ink-3 rounded-sm border border-ink-2 flex flex-col justify-between relative">
              <div className="text-2xl font-extrabold text-signal font-tabular mb-4">
                04.
              </div>
              <div>
                <h3 className="font-serif-headline text-lg font-bold text-ivory">
                  <T k="home.how-step4-title">Visit &amp; Close</T>
                </h3>
                <p className="mt-2 text-xs text-mist leading-relaxed">
                  <T k="home.how-step4-text">Inspect the land with your lawyer, agree terms with the owner and complete the paperwork.</T>
                </p>
              </div>
              <div className="mt-4 text-[11px] text-signal font-tabular font-semibold">
                <T k="home.deal-closure-support">Deal Closure Support →</T>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. TRUST / VERIFICATION EXPLAINER SECTION (Visual breakdown of what "Verified" actually means) */}
      {features.humanReview && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-sand rounded-md border border-line p-8 lg:p-12">
          <div className="max-w-2xl mb-8">
            <div className="flex items-center gap-2 text-moss text-xs font-bold uppercase tracking-wider font-tabular">
              <ShieldCheck className="w-4 h-4" />
              <span>The PLOTSS Verification Standard</span>
            </div>
            <h2 className="font-serif-headline text-3xl sm:text-4xl font-bold text-graphite mt-1">
              <T k="home.what-does-verified-actually-mean-on">What does "Verified" actually mean on PLOTSS?</T>
            </h2>
            <p className="mt-2 text-sm text-stone leading-relaxed">
              <T k="home.every-plot-carrying-our-deep-moss">Every plot carrying our Deep Moss badge has passed four rigorous legal and physical verification gates before going live.</T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-sm border border-line">
              <div className="w-8 h-8 rounded-sm paint-moss text-ivory flex items-center justify-center font-bold font-tabular text-sm mb-3">
                1
              </div>
              <h3 className="font-serif-headline text-lg font-bold text-graphite">
                <T k="home.ownership-30-year-title-search">Ownership & Title Check</T>
              </h3>
              <p className="mt-2 text-xs text-stone leading-relaxed">
                <T k="home.direct-verification-of-government-revenue-land">We check the government land records (khasra/khatauni, registered mutation entries) and the sub-registrar's encumbrance certificate to confirm the seller owns the land and it is free of pending disputes.</T>
              </p>
            </div>

            <div className="bg-white p-5 rounded-sm border border-line">
              <div className="w-8 h-8 rounded-sm paint-moss text-ivory flex items-center justify-center font-bold font-tabular text-sm mb-3">
                2
              </div>
              <h3 className="font-serif-headline text-lg font-bold text-graphite">
                <T k="home.statutory-approvals-nocs">Approvals & Land-Use Checks</T>
              </h3>
              <p className="mt-2 text-xs text-stone leading-relaxed">
                <T k="home.verification-of-collector-non-agriculture-na">We verify the land-use conversion order, master plan zoning with the local development authority, pollution board clearance (where applicable), and road-access permissions.</T>
              </p>
            </div>

            <div className="bg-white p-5 rounded-sm border border-line">
              <div className="w-8 h-8 rounded-sm paint-moss text-ivory flex items-center justify-center font-bold font-tabular text-sm mb-3">
                3
              </div>
              <h3 className="font-serif-headline text-lg font-bold text-graphite">
                <T k="home.dgps-physical-boundary-survey">Boundary & Site Survey</T>
              </h3>
              <p className="mt-2 text-xs text-stone leading-relaxed">
                <T k="home.sub-meter-accurate-differential-gps-coordinate">A precise site survey confirms the plot's exact corner boundaries, checks for any encroachment, and verifies the actual road frontage width.</T>
              </p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 8. "FOR BROKERS & AGENTS" CTA BANNER (Distinct visual treatment, directing to broker signup) */}
      {features.brokers && (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div
          id="broker-cta-banner"
          className="relative overflow-hidden paint-clay text-ivory rounded-md border border-clay p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md"
        >
          {/* Soft highlight glow in the corner — reads as premium, not a flat CTA block */}
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-ivory/15 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="relative space-y-2 max-w-xl">
            <span className="paint-graphite text-signal text-[11px] font-bold px-2.5 py-1 rounded-[3px] uppercase font-tabular tracking-wider">
              <T k="home.channel-partner-network">Channel Partner Network</T>
            </span>
            <h2 className="font-serif-headline text-2xl sm:text-3xl font-bold leading-tight">
              <T k="home.are-you-an-industrial-broker-or">Are you an Industrial Broker or Land Consultant?</T>
            </h2>
            <p className="text-sm text-ivory/90 leading-relaxed">
              <T k="home.list-your-client-mandates-with-ai">List your client mandates with AI-generated dossiers, receive direct institutional buyer leads with verified budgets, and showcase your verified RERA credential page.</T>
            </p>
          </div>

          <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              id="broker-banner-signup-btn"
              onClick={() => onNavigate('broker_dashboard')}
              className="paint-graphite hover:bg-ink-3 text-ivory font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-sm border border-graphite transition-colors cursor-pointer text-center font-tabular shadow-sm"
            >
              <T k="home.open-broker-dashboard">Open Broker Dashboard</T>
            </button>
            <button
              id="broker-banner-profile-btn"
              onClick={() => onNavigate('broker_profile')}
              className="bg-transparent hover:bg-black/15 text-ivory font-semibold text-xs uppercase tracking-wider px-5 py-3 rounded-sm border border-ivory transition-colors cursor-pointer text-center font-tabular"
            >
              <T k="home.view-public-broker-profile">View Public Broker Profile</T>
            </button>
          </div>
        </div>
      </section>
      )}

      {/* 9. TESTIMONIALS STRIP */}
      <Show k="home.testimonials">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-trust uppercase tracking-wider font-tabular">
            <T k="home.institutional-trust">Institutional Trust</T>
          </span>
          <h2 className="font-serif-headline text-3xl font-bold text-graphite mt-1">
            <T k="home.trusted-by-manufacturing-leaders-3pl-funds">Trusted by Buyers & Owners in NCR</T>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-sm border border-line shadow-xs">
            <div className="flex text-clay text-sm mb-3">★★★★★</div>
            <p className="text-xs text-stone leading-relaxed italic">
              <T k="home.testimonial-1-quote">"We were looking for a plot near Indirapuram for over a year. PLOTSS showed us the land records and mutation status upfront, so we knew what we were buying before the first visit."</T>
            </p>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-graphite block"><T k="home.testimonial-1-name">Rohit Sharma</T></span>
                <span className="text-[11px] text-stone"><T k="home.testimonial-1-role">Buyer, Ghaziabad</T></span>
              </div>
              <span className="text-[11px] bg-sand px-2 py-0.5 rounded text-graphite font-tabular"><T k="home.testimonial-1-tag">Ghaziabad</T></span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-sm border border-line shadow-xs">
            <div className="flex text-clay text-sm mb-3">★★★★★</div>
            <p className="text-xs text-stone leading-relaxed italic">
              <T k="home.testimonial-2-quote">"The site survey confirmed the boundary and road frontage exactly as listed. No surprises when our own engineer inspected the plot in Noida."</T>
            </p>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-graphite block"><T k="home.testimonial-2-name">Priya Verma</T></span>
                <span className="text-[11px] text-stone"><T k="home.testimonial-2-role">Buyer, Noida</T></span>
              </div>
              <span className="text-[11px] bg-sand px-2 py-0.5 rounded text-graphite font-tabular"><T k="home.testimonial-2-tag">Noida</T></span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-sm border border-line shadow-xs">
            <div className="flex text-clay text-sm mb-3">★★★★★</div>
            <p className="text-xs text-stone leading-relaxed italic">
              <T k="home.testimonial-3-quote">"Listing our family plot in New Delhi was simple — the AI helped write a clear description, and we started getting genuine buyer enquiries within days."</T>
            </p>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-graphite block"><T k="home.testimonial-3-name">Anil Khanna</T></span>
                <span className="text-[11px] text-stone"><T k="home.testimonial-3-role">Owner, New Delhi</T></span>
              </div>
              <span className="text-[11px] bg-sand px-2 py-0.5 rounded text-graphite font-tabular"><T k="home.testimonial-3-tag">New Delhi</T></span>
            </div>
          </div>
        </div>
      </section>
      </Show>

      {/* 10. BLOG / CONTENT PREVIEW (3 Cards) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-trust uppercase tracking-wider font-tabular">
              <T k="home.market-intelligence">Market Intelligence</T>
            </span>
            <h2 className="font-serif-headline text-3xl font-bold text-graphite mt-1">
              <T k="home.industrial-land-due-diligence-insights">Industrial Land Due Diligence Insights</T>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blog.map((post) => (
            <article 
              key={post.id}
              className="bg-white rounded-sm border border-line p-5 hover:border-graphite transition-all flex flex-col justify-between group shadow-xs hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              onClick={() => { window.location.href = `/blog/${post.slug}`; }}
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-stone font-tabular mb-2">
                  <span className="text-clay font-semibold">{post.tag}</span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="font-serif-headline text-lg font-bold text-graphite group-hover:text-clay transition-colors leading-snug">
                  {post.title}
                </h3>
                <p className="mt-2 text-xs text-stone leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-graphite">
                <span className="text-[11px] text-stone font-tabular">{post.date}</span>
                <span className="group-hover:text-clay flex items-center gap-1">
                  Read Article <ArrowUpRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
};
