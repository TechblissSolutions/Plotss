'use client';
import { ListingsMap } from '../components/ListingsMap';
import { NearMe } from '../components/NearMe';
import { distanceKm, formatKm, listingPoint, mapsHref, type Origin } from '@/lib/geo';
import { track } from '../tracking/tracker';
import React, { useState, useMemo } from 'react';
import { Listing, ListingCategory, ListingType, ZoneType, ScreenId, ParsedQuery } from '../types';
import { useData } from '../data/DataProvider';
import { AbstractPlotVisual } from '../components/AbstractPlotVisual';
import { 
  Search, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Lock, 
  SlidersHorizontal, 
  ArrowUpDown, 
  MapPin, 
  Check, 
  RotateCcw,
  LayoutGrid,
  ListFilter,
  Layers,
  Building2,
  ChevronDown,
  Heart,
  Map as MapIcon
} from 'lucide-react';

interface SearchScreenProps {
  initialQuery?: string;
  /** Server-side AI (or rule) parser for the natural-language box. */
  onParseQuery?: (q: string) => Promise<ParsedQuery | null>;
  initialType?: ListingType;
  onSelectListing: (slug: string) => void;
  onNavigate: (screen: ScreenId) => void;
  onUnlockContact: (listing: Listing) => void;
  savedIds: string[];
  onToggleSave: (id: string) => void;
  comparedListings: Listing[];
  onToggleCompare: (listing: Listing) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  initialQuery = '',
  onParseQuery,
  initialType = 'Buy',
  onSelectListing,
  onNavigate,
  onUnlockContact,
  savedIds,
  onToggleSave,
  comparedListings,
  onToggleCompare,
}) => {
  const { listings: ALL_LISTINGS, features, cityList } = useData();
  // Natural language query & parsed chips
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const pendingSearch = React.useRef('');

  // Filter Sidebar State
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedListingType, setSelectedListingType] = useState<ListingType | 'All'>(initialType || 'All');
  const [maxBudgetCr, setMaxBudgetCr] = useState<number>(20);
  const [minAreaAcres, setMinAreaAcres] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'match' | 'price_asc' | 'price_desc' | 'area_desc' | 'newest' | 'nearest'>('match');
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [radiusKm, setRadiusKm] = useState(0);
  const changeOrigin = (o: Origin | null) => { setOrigin(o); setSortBy(o ? 'nearest' : 'match'); };
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Remove a parsed AI chip and undo the filter it set
  const handleRemoveChip = (chip: string) => {
    setActiveChips((prev) => prev.filter((c) => c !== chip));
    if (chip === selectedCity) setSelectedCity('All');
    else if (chip === selectedCategory) setSelectedCategory('All');
    else if (chip.startsWith('For ')) setSelectedListingType('All');
    else if (chip.includes('Cr')) setMaxBudgetCr(20);
    else if (chip.includes('Acres')) setMinAreaAcres(0);
  };

  // Turn a natural-language query into filters using the server parser (AI when configured, rules otherwise).
  const runParse = async (text: string) => {
    if (!text.trim() || !onParseQuery) return;
    setParsing(true);
    const p = await onParseQuery(text);
    setParsing(false);
    if (!p) { setActiveChips([text.slice(0, 24)]); return; }
    const chips: string[] = [];
    const cityOpt = p.city ? cityList.find((c) => c.slug === p.city || c.slug.startsWith(p.city!))?.name : undefined;
    if (cityOpt) { setSelectedCity(cityOpt); chips.push(cityOpt); }
    if (p.category) { const cat = p.category[0].toUpperCase() + p.category.slice(1); setSelectedCategory(cat); chips.push(cat); }
    if (p.listing_type) { const t = ({ sale: 'Buy', lease: 'Lease', rent: 'Rent' } as Record<string, ListingType>)[p.listing_type]; if (t) { setSelectedListingType(t); chips.push('For ' + t); } }
    if (p.maxPrice) { const cr = +(p.maxPrice / 1e7).toFixed(2); setMaxBudgetCr(Math.max(0.1, cr)); chips.push('Under ₹' + cr + 'Cr'); }
    const acres = p.minAcres ?? p.targetAcres;
    if (acres) { setMinAreaAcres(Math.floor(acres * 10) / 10); chips.push(Math.floor(acres * 10) / 10 + '+ Acres'); }
    if (p.zone) chips.push(p.zone);
    setActiveChips(chips.length ? chips : [text.slice(0, 24)]);
  };
  // Parse the query from the URL once on load (async: state is set after the server responds).
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  React.useEffect(() => { if (initialQuery) { pendingSearch.current = initialQuery.slice(0, 80); void runParse(initialQuery); } }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pendingSearch.current = searchQuery.slice(0, 80);
    void runParse(searchQuery);
  };

  const handleResetFilters = () => {
    setSelectedCity('All');
    setSelectedCategory('All');
    setSelectedListingType('All');
    setMaxBudgetCr(20);
    setMinAreaAcres(0);
    setSelectedZone('All');
    setVerifiedOnly(false);
    setActiveChips([]);
  };

  // Match score = how well a listing fits what the buyer asked for (only criteria they set count).
  const matchOf = (l: Listing): number => {
    const checks: [number, number][] = [];
    if (selectedCity !== 'All') checks.push([30, l.city === selectedCity ? 1 : 0]);
    if (selectedCategory !== 'All') checks.push([20, l.category === selectedCategory ? 1 : 0]);
    if (selectedListingType !== 'All') checks.push([10, l.listingType === selectedListingType ? 1 : 0]);
    if (maxBudgetCr < 20) { const r = l.price / 1e7 / maxBudgetCr; checks.push([25, r <= 1 ? 1 - Math.max(0, r - 0.6) * 0.5 : Math.max(0, 1 - (r - 1) * 3)]); }
    if (minAreaAcres > 0) checks.push([15, Math.min(1, l.area / minAreaAcres)]);
    if (!checks.length) return 0;
    const total = checks.reduce((a, [w]) => a + w, 0);
    return Math.round((checks.reduce((a, [w, x]) => a + w * x, 0) / total) * 100);
  };

  const kmFrom = (l: Listing): number | null => {
    if (!origin) return null;
    const p = listingPoint(l);
    return p ? distanceKm(origin, p) : null;
  };

  // Filter listings
  const filteredListings = useMemo(() => {
    return ALL_LISTINGS.filter((item) => {
      if (selectedCity !== 'All' && item.city !== selectedCity) return false;
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (selectedListingType !== 'All' && item.listingType !== selectedListingType) return false;
      if (selectedZone !== 'All' && item.zoneType !== selectedZone) return false;
      if (verifiedOnly && !item.verified) return false;
      if (item.area < minAreaAcres) return false;
      // Budget conversion
      const priceCr = item.price / 10000000;
      if (item.listingType === 'Buy' && priceCr > maxBudgetCr) return false;
      if (origin && radiusKm > 0) {
        const p = listingPoint(item);
        if (!p || distanceKm(origin, p) > radiusKm) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'match') return matchOf(b) - matchOf(a);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'area_desc') return b.area - a.area;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'nearest' && origin) return (kmFrom(a) ?? 1e9) - (kmFrom(b) ?? 1e9);
      return 0;
    });
  }, [selectedCity, selectedCategory, selectedListingType, maxBudgetCr, minAreaAcres, selectedZone, verifiedOnly, sortBy, origin, radiusKm]);

  // After a typed search has been parsed and filters applied, record the query and its result count.
  React.useEffect(() => {
    if (!pendingSearch.current || parsing) return;
    track('search', pendingSearch.current, { results: filteredListings.length, chips: activeChips.length });
    pendingSearch.current = '';
  }, [filteredListings.length, activeChips, parsing]);

  return (
    <div id="search-page-root" className="min-h-screen bg-ivory text-graphite pb-24">
      
      {/* Top AI Bar: Applied AI-Parsed Query as Removable Chips */}
      <section className="bg-white border-b border-line sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Natural language query input & chip container */}
            <div className="flex-1 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-graphite font-tabular uppercase shrink-0">
                <span className="w-2 h-2 rounded-full paint-signal" />
                <Sparkles className="w-3.5 h-3.5 text-graphite" />
                <span className="hidden sm:inline">AI Parsed Intent:</span>
              </div>

              {/* Removable Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1 paint-graphite text-ivory text-xs font-medium px-2.5 py-1 rounded-sm border border-graphite font-tabular shadow-2xs"
                  >
                    <span>{chip}</span>
                    <button
                      onClick={() => handleRemoveChip(chip)}
                      className="hover:text-signal p-0.5 rounded cursor-pointer"
                      title="Remove filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {activeChips.length === 0 && (
                  <span className="text-xs text-stone italic">
                    Showing all available inventory
                  </span>
                )}
              </div>
            </div>

            {/* Quick Query Bar */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full md:w-auto">
              <div className="relative w-full">
                <input
                  id="search-top-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Refine prompt e.g. '5 acre warehouse in Bhiwandi'"
                  className="w-full bg-ivory text-xs text-graphite pl-3 pr-8 py-2 rounded-sm border border-line focus:outline-none focus:border-graphite"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-graphite hover:text-clay cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 paint-graphite text-ivory text-xs px-3 py-2 rounded-sm shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Search Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-start gap-8">
          
          {/* LEFT FILTER SIDEBAR (Desktop) */}
          <aside 
            id="search-filter-sidebar"
            className="w-72 shrink-0 hidden lg:block bg-white rounded-sm border border-line p-5 space-y-6 self-start sticky top-36 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase font-tabular tracking-wider text-graphite">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Listing Filters</span>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-[11px] text-stone hover:text-clay underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* City Filter */}
            <div>
              <label htmlFor="filter-city-select" className="block text-xs font-bold text-graphite uppercase tracking-wider font-tabular mb-2">
                City
              </label>
              <select
                id="filter-city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-ivory text-xs font-medium text-graphite border border-line rounded-sm px-3 py-2 focus:outline-none focus:border-graphite cursor-pointer"
              >
                <option value="All">All cities</option>
                {cityList.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <span className="block text-xs font-bold text-graphite uppercase tracking-wider font-tabular mb-2">
                Property Type
              </span>
              <div className="space-y-1.5">
                {(['All', 'Industrial', 'Warehousing', 'Commercial', 'Residential'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer flex items-center justify-between ${
                      selectedCategory === cat
                        ? 'paint-graphite text-ivory font-semibold'
                        : 'text-stone hover:bg-sand hover:text-graphite'
                    }`}
                  >
                    <span>{cat === 'All' ? 'All Classifications' : cat}</span>
                    {selectedCategory === cat && <Check className="w-3 h-3 text-signal" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Listing Type (Buy / Lease / Rent) */}
            <div>
              <span className="block text-xs font-bold text-graphite uppercase tracking-wider font-tabular mb-2">
                Transaction Type
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-ivory rounded-sm border border-line">
                {(['All', 'Buy', 'Lease'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedListingType(type)}
                    className={`text-xs py-1.5 rounded-[3px] font-semibold transition-colors cursor-pointer font-tabular ${
                      selectedListingType === type
                        ? 'paint-graphite text-ivory'
                        : 'text-stone hover:text-graphite'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Range Slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="budget-slider" className="text-xs font-bold text-graphite uppercase tracking-wider font-tabular">
                  Max Budget
                </label>
                <span className="text-xs font-bold text-clay font-tabular">
                  Up to ₹{maxBudgetCr} Cr
                </span>
              </div>
              <input
                id="budget-slider"
                type="range"
                min={1}
                max={25}
                step={1}
                value={maxBudgetCr}
                onChange={(e) => setMaxBudgetCr(Number(e.target.value))}
                className="w-full accent-clay cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-stone font-tabular mt-1">
                <span>₹ 1 Cr</span>
                <span>₹ 10 Cr</span>
                <span>₹ 25+ Cr</span>
              </div>
            </div>

            {/* Minimum Area Range */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-graphite uppercase tracking-wider font-tabular">
                  Minimum Area
                </span>
                <span className="text-xs font-bold text-graphite font-tabular">
                  {minAreaAcres === 0 ? 'Any Size' : `${minAreaAcres}+ Acres`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[0, 2, 4, 6].map((acres) => (
                  <button
                    key={acres}
                    onClick={() => setMinAreaAcres(acres)}
                    className={`text-xs py-1.5 rounded-[3px] border font-tabular transition-colors cursor-pointer ${
                      minAreaAcres === acres
                        ? 'paint-graphite text-ivory border-graphite font-bold'
                        : 'bg-ivory text-stone border-line hover:border-graphite'
                    }`}
                  >
                    {acres === 0 ? 'All' : `${acres}Ac+`}
                  </button>
                ))}
              </div>
            </div>

            {/* Zone Type Filter */}
            <div>
              <label htmlFor="zone-type-select" className="block text-xs font-bold text-graphite uppercase tracking-wider font-tabular mb-2">
                Zoning & Master Plan
              </label>
              <select
                id="zone-type-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-ivory text-xs font-medium text-graphite border border-line rounded-sm px-3 py-2 focus:outline-none focus:border-graphite cursor-pointer"
              >
                <option value="All">All Sanctioned Zones</option>
                <option value="Industrial (Heavy/Chemical)">Industrial (Heavy/Chemical)</option>
                <option value="Industrial (Light/Engineering)">Industrial (Light/Engineering)</option>
                <option value="Warehousing & Logistics">Warehousing & Logistics</option>
                <option value="Commercial IT/SEZ">Commercial IT/SEZ</option>
                <option value="Residential NA (R-Zone)">Residential NA (R-Zone)</option>
              </select>
            </div>

            {/* Verified Only Toggle (only meaningful when staff verification is on) */}
            {features.humanReview && <div className="pt-2 border-t border-line">
              <label className="flex items-center gap-2 text-xs font-semibold text-graphite cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => setVerifiedOnly(e.target.checked)}
                  className="rounded text-moss focus:ring-moss w-4 h-4 accent-moss"
                />
                <span className="flex items-center gap-1 text-moss">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified only</span>
                </span>
              </label>
            </div>}
          </aside>

          {/* RIGHT COLUMN: Results Header & Listing Grid */}
          <main className="flex-1">
            
            <NearMe origin={origin} radius={radiusKm} onOrigin={changeOrigin} onRadius={setRadiusKm} />

            {/* Results bar & sort controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-line">
              <div>
                <h1 className="font-serif-headline text-2xl font-bold text-graphite">
                  Industrial Land & Plot Parcels
                </h1>
                <p className="text-xs text-stone font-tabular mt-0.5">
                  Showing <strong className="text-graphite">{filteredListings.length}</strong> pre-audited land assets matching criteria
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5 text-xs text-stone">
                  <ArrowUpDown className="w-3.5 h-3.5 text-graphite" />
                  <span className="hidden sm:inline">Sort:</span>
                  <select
                    id="search-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white text-xs font-semibold text-graphite border border-line rounded-sm px-2.5 py-1.5 focus:outline-none focus:border-graphite cursor-pointer"
                  >
                    {origin && <option value="nearest">Nearest first</option>}
                    <option value="match">★ Highest AI Match</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="area_desc">Plot Area: Largest First</option>
                    <option value="newest">Newest first</option>
                  </select>
                </div>

                {/* Grid / List layout toggle */}
                <div className="flex items-center border border-line rounded-sm overflow-hidden bg-white">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 cursor-pointer ${viewMode === 'grid' ? 'paint-graphite text-ivory' : 'text-stone hover:text-graphite'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 cursor-pointer ${viewMode === 'list' ? 'paint-graphite text-ivory' : 'text-stone hover:text-graphite'}`}
                    title="Detailed List View"
                  >
                    <ListFilter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-1.5 cursor-pointer ${viewMode === 'map' ? 'paint-graphite text-ivory' : 'text-stone hover:text-graphite'}`}
                    title="Map View"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Listing Grid / List */}
            {filteredListings.length === 0 ? (
              <div className="bg-white rounded-sm border border-line p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-sand text-stone flex items-center justify-center mx-auto">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-serif-headline text-xl font-bold text-graphite">
                  No matching parcels for current filters
                </h3>
                <p className="text-xs text-stone max-w-sm mx-auto">
                  Try adjusting the budget ceiling or clearing specific micro-market filters to see more listings.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-2 inline-flex items-center gap-1.5 paint-graphite text-ivory text-xs font-semibold px-4 py-2 rounded-sm cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            ) : viewMode === 'map' ? (
              <ListingsMap listings={filteredListings} origin={origin} onSelect={(slug) => onSelectListing(slug)} />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                {filteredListings.map((plot) => {
                  const isCompared = comparedListings.some((p) => p.id === plot.id);
                  const isSaved = savedIds.includes(plot.id);

                  return (
                    <div
                      key={plot.id}
                      id={`search-card-${plot.id}`}
                      className="group bg-white rounded-sm border border-line hover:border-graphite transition-all overflow-hidden flex flex-col cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5"
                      onClick={() => onSelectListing(plot.slug)}
                    >
                      {/* Abstract 3D geometric plot wireframe or Real Drone Photo */}
                      <div className="relative">
                        <AbstractPlotVisual
                          variant="card"
                          geometryType={plot.plotGeometryType}
                          areaDisplay={plot.areaDisplay}
                          roadWidth={plot.roadWidth}
                          aiScore={matchOf(plot)}
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

                        {/* Zone tag */}
                        <div className="absolute bottom-7 right-2.5 z-10 bg-graphite/95 text-ivory text-[11px] font-medium px-2 py-0.5 rounded-[3px] border border-ink-4 font-tabular">
                          {plot.zoneType}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          {/* Micro-market */}
                          <div className="flex items-center gap-1.5 text-xs text-stone font-tabular mb-1.5">
                            <MapPin className="w-3.5 h-3.5 text-clay shrink-0" />
                            <span className="font-semibold text-graphite">{plot.city}</span>
                            <span>•</span>
                            <span className="truncate">{plot.microMarket}</span>
                            {kmFrom(plot) != null && <span className="ml-auto shrink-0 rounded-sm bg-sand px-2 py-0.5 font-bold text-graphite">About {formatKm(kmFrom(plot)!)} away</span>}
                          </div>

                          <h3 className="font-serif-headline text-lg font-bold text-graphite group-hover:text-clay transition-colors line-clamp-2 leading-snug">
                            {plot.title}
                          </h3>

                          {/* Specifications Bar */}
                          <div className="mt-3 grid grid-cols-2 gap-2 pt-3 border-t border-line text-xs font-tabular">
                            <div>
                              <span className="text-stone block text-[11px] uppercase">Plot Area</span>
                              <span className="font-bold text-graphite">{plot.areaDisplay}</span>
                            </div>
                            <div>
                              <span className="text-stone block text-[11px] uppercase">Road Width</span>
                              <span className="font-semibold text-graphite truncate block">{plot.roadWidth}</span>
                            </div>
                          </div>

                          {/* AI Match Reasons snippet */}
                          <div className="mt-2.5 bg-ivory p-2 rounded-[3px] border border-line text-[11px] text-stone flex items-start gap-1.5">
                            <span className="text-clay font-bold">★</span>
                            <span className="truncate">{plot.matchReasons?.[0] ?? plot.tagline}</span>
                          </div>
                        </div>

                        {/* Price & Compare Button */}
                        <div className="pt-3 border-t border-line flex items-end justify-between">
                          <div>
                            <span className="text-[11px] uppercase tracking-wider text-stone block font-tabular">
                              {plot.listingType === 'Lease' ? 'Monthly Lease' : 'Outright Price'}
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
                                onToggleCompare(plot);
                              }}
                              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors cursor-pointer ${
                                isCompared
                                  ? 'paint-graphite text-signal border-graphite'
                                  : 'bg-ivory text-graphite border-line hover:border-graphite'
                              }`}
                            >
                              {isCompared ? '✓ Selected' : '+ Compare'}
                            </button>
                          </div>
                        </div>

                        {/* MASKED CONTACT PREVIEW (e.g. "R***** S***** • +91 98***4XX" with small lock icon) */}
                        <div
                          className="pt-2 border-t border-dashed border-line flex items-center justify-between text-[11px] text-stone hover:text-graphite"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlockContact(plot);
                          }}
                        >
                          <div className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-clay" />
                            <span className="font-tabular font-medium text-graphite">
                              {plot.ownerMaskedName}
                            </span>
                            <span>•</span>
                            <span className="font-tabular">{plot.ownerMaskedPhone}</span>
                          </div>
                          <span className="text-[11px] text-clay font-semibold underline">
                            Unlock Contact Details
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Detailed List View */
              <div className="space-y-4">
                {filteredListings.map((plot) => {
                  const isCompared = comparedListings.some((p) => p.id === plot.id);
                  const isSaved = savedIds.includes(plot.id);
                  return (
                    <div
                      key={plot.id}
                      onClick={() => onSelectListing(plot.slug)}
                      className="group bg-white rounded-sm border border-line hover:border-graphite p-4 transition-all flex flex-col md:flex-row gap-5 cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <div className="w-full md:w-56 h-36 shrink-0 rounded-[3px] overflow-hidden">
                        <AbstractPlotVisual
                          variant="card"
                          geometryType={plot.plotGeometryType}
                          areaDisplay={plot.areaDisplay}
                          roadWidth={plot.roadWidth}
                          aiScore={matchOf(plot)}
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-tabular text-stone">
                              {plot.city} • {plot.microMarket}{kmFrom(plot) != null && <b className="ml-2 text-graphite">About {formatKm(kmFrom(plot)!)} away</b>}
                            </span>
                            <span className="paint-signal text-graphite text-[11px] font-bold px-2 py-0.5 rounded-[3px] font-tabular border border-graphite">
                              ★ {matchOf(plot)}% Match
                            </span>
                          </div>

                          <h3 className="font-serif-headline text-lg font-bold text-graphite group-hover:text-clay mt-1">
                            {plot.title}
                          </h3>

                          <p className="mt-1 text-xs text-stone line-clamp-2">
                            {plot.aiDescription}
                          </p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <span className="text-lg font-extrabold text-graphite font-tabular">
                              {plot.priceDisplay}
                            </span>
                            <span className="text-xs text-stone font-tabular ml-2">
                              ({plot.pricePerUnit})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
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
                                onToggleCompare(plot);
                              }}
                              className="text-xs font-semibold px-3 py-1.5 rounded-sm border border-line bg-ivory hover:border-graphite cursor-pointer font-tabular"
                            >
                              {isCompared ? '✓ Compared' : '+ Compare'}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUnlockContact(plot);
                              }}
                              className="text-xs font-semibold px-3 py-1.5 rounded-sm paint-graphite text-ivory hover:paint-clay transition-colors cursor-pointer flex items-center gap-1 font-tabular"
                            >
                              <Lock className="w-3 h-3 text-signal" />
                              <span>Unlock Contact</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filter Slide-out Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-graphite/75 backdrop-blur-xs">
          <div className="w-4/5 max-w-sm bg-white h-full p-6 overflow-y-auto ml-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="font-serif-headline text-lg font-bold text-graphite">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-bold text-graphite uppercase font-tabular mb-1">
                Region
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full bg-ivory text-xs font-medium border border-line rounded-sm p-2"
              >
                <option value="All">All cities</option>
                {cityList.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {/* Budget */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>Max Budget:</span>
                <span className="text-clay">₹{maxBudgetCr} Cr</span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                value={maxBudgetCr}
                onChange={(e) => setMaxBudgetCr(Number(e.target.value))}
                className="w-full accent-clay"
              />
            </div>

            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full paint-graphite text-ivory py-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider"
            >
              Apply Filters ({filteredListings.length} Results)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
