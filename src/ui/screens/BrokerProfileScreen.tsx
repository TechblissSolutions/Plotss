'use client';
import React from 'react';
import { ScreenId, Listing } from '../types';
import { useData } from '../data/DataProvider';
import { AbstractPlotVisual } from '../components/AbstractPlotVisual';
import { 
  ShieldCheck, 
  Star, 
  MapPin, 
  Building, 
  Phone, 
  Mail, 
  ArrowLeft, 
  Briefcase, 
  Award, 
  CheckCircle2, 
  Lock,
  ExternalLink
} from 'lucide-react';

interface BrokerProfileScreenProps {
  brokerId?: string;
  onNavigate: (screen: ScreenId, slug?: string) => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
  onSelectListing: (slug: string) => void;
  onUnlockContact: (listing: Listing) => void;
}

export const BrokerProfileScreen: React.FC<BrokerProfileScreenProps> = ({
  brokerId = 'brk-01',
  onNavigate,
  onOpenAuth,
  isAuthenticated,
  onSelectListing,
  onUnlockContact,
}) => {
  const { listings: ALL_LISTINGS, brokers: ALL_BROKERS } = useData();
  const broker = ALL_BROKERS.find(b => b.id === brokerId) || ALL_BROKERS[0];
  const brokerListings = ALL_LISTINGS.filter(l => l.brokerId === broker.id);

  return (
    <div id="broker-profile-page" className="min-h-screen bg-ivory text-graphite pb-24">
      
      {/* Top Breadcrumb */}
      <div className="bg-white border-b border-line py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-tabular">
          <button
            onClick={() => onNavigate('search')}
            className="text-stone hover:text-graphite flex items-center gap-1 cursor-pointer font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Marketplace</span>
          </button>
          <span className="text-moss font-bold">RERA Registered Advisory</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* 1. HEADER (Photo, name, license/RERA number, verified badge (moss green), experience years, deals closed count) */}
        <section className="bg-white rounded-md border border-line p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Broker Avatar & Bio */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="relative">
                <img
                  src={broker.photoUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80'}
                  alt={broker.name}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-sm object-cover border-2 border-graphite shadow-sm"
                />
                {/* Verified Badge (Moss Green var(--c-moss)) */}
                <div className="absolute -bottom-2 -right-2 paint-moss text-ivory p-1.5 rounded-full border-2 border-white shadow-xs" title="Certified Land Advisory">
                  <ShieldCheck className="w-4 h-4 text-signal" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif-headline text-2xl sm:text-3xl font-extrabold text-graphite">
                    {broker.name}
                  </h1>

                  <span className="paint-moss text-ivory text-xs font-bold px-2.5 py-0.5 rounded-[3px] font-tabular flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-signal" />
                    <span>VERIFIED BROKER</span>
                  </span>
                </div>

                <p className="text-sm font-semibold text-clay">
                  {broker.firmName}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-stone font-tabular pt-1">
                  <span className="bg-ivory px-2 py-0.5 rounded border border-line font-bold text-graphite">
                    RERA: {broker.reraNumber}
                  </span>
                  <span>•</span>
                  <span>{broker.cities.join(', ')} & Western Corridor</span>
                </div>
              </div>
            </div>

            {/* Quick Stats & Contact CTA */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-line">
              <div className="flex items-center gap-6 text-xs font-tabular">
                <div>
                  <span className="text-stone block text-[11px] uppercase font-bold">Experience</span>
                  <span className="text-xl font-black text-graphite">{broker.yearsActive} Years</span>
                </div>
                <div>
                  <span className="text-stone block text-[11px] uppercase font-bold">Deals Closed</span>
                  <span className="text-xl font-black text-graphite">{broker.propertiesClosed}+ Parcels</span>
                </div>
                <div>
                  <span className="text-stone block text-[11px] uppercase font-bold">Client Rating</span>
                  <span className="text-xl font-black text-graphite flex items-center gap-1">
                    <Star className="w-4 h-4 fill-signal text-graphite" />
                    <span>{broker.rating}</span>
                  </span>
                </div>
              </div>

              {/* Contact Broker CTA (Opens auth if not logged in) */}
              <button
                id="contact-broker-btn"
                onClick={() => {
                  if (!isAuthenticated) {
                    onOpenAuth();
                  } else {
                    alert(`Direct contact line for ${broker.name}: +91 98220 18492`);
                  }
                }}
                className="w-full sm:w-auto paint-graphite hover:paint-clay text-ivory text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs font-tabular"
              >
                {!isAuthenticated && <Lock className="w-3.5 h-3.5 text-signal" />}
                <span>{isAuthenticated ? 'Call Broker Direct' : 'Unlock Broker Contact'}</span>
              </button>
            </div>

          </div>

          {/* 2. SPECIALIZATION TAGS */}
          <div className="mt-6 pt-5 border-t border-line flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-stone uppercase font-tabular tracking-wider mr-2">
              Domain Specializations:
            </span>
            {broker.specializations.map((spec, i) => (
              <span
                key={i}
                className="bg-ivory text-graphite text-xs font-semibold px-3 py-1 rounded-[3px] border border-line font-tabular"
              >
                {spec}
              </span>
            ))}
          </div>
        </section>

        {/* 3. ACTIVE LISTINGS GRID (Using the same card design) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-line">
            <div>
              <h2 className="font-serif-headline text-2xl font-bold text-graphite">
                Active Exclusive Land Mandates ({brokerListings.length})
              </h2>
              <p className="text-xs text-stone">
                Direct owner-represented industrial & commercial parcels under verified advisory
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brokerListings.map((plot) => (
              <div
                key={plot.id}
                onClick={() => onSelectListing(plot.slug)}
                className="group bg-white rounded-sm border border-line hover:border-graphite transition-all overflow-hidden flex flex-col cursor-pointer shadow-xs hover:shadow-md"
              >
                <div className="relative">
                  <AbstractPlotVisual
                    variant="card"
                    geometryType={plot.plotGeometryType}
                    areaDisplay={plot.areaDisplay}
                    roadWidth={plot.roadWidth}
                    aiScore={plot.aiMatchScore}
                  />

                  {plot.verified && (
                    <div className="absolute top-2.5 left-2.5 paint-moss text-ivory text-[11px] font-semibold px-2 py-0.5 rounded-[3px] border border-moss flex items-center gap-1 font-tabular">
                      <ShieldCheck className="w-3 h-3 text-signal" />
                      <span>TITLE VERIFIED</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs text-stone font-tabular">
                      {plot.city} • {plot.microMarket}
                    </div>
                    <h3 className="font-serif-headline text-base font-bold text-graphite group-hover:text-clay transition-colors line-clamp-2 mt-0.5">
                      {plot.title}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-line flex items-center justify-between font-tabular">
                    <div>
                      <div className="text-lg font-black text-graphite">
                        {plot.priceDisplay}
                      </div>
                      <div className="text-[11px] text-stone">
                        {plot.areaDisplay}
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-clay underline">
                      Inspect Dossier →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. CLIENT TESTIMONIALS / REVIEWS WITH STAR RATINGS */}
        <section className="bg-white rounded-md border border-line p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div>
              <h3 className="font-serif-headline text-2xl font-bold text-graphite">
                Institutional Buyer & Landowner Endorsements
              </h3>
              <p className="text-xs text-stone">
                Verified reviews from transactions closed across Chakan, Talegaon, and Ranjangaon
              </p>
            </div>
            <div className="flex items-center gap-1 bg-ivory px-3 py-1.5 rounded border border-line text-xs font-bold font-tabular">
              <Star className="w-4 h-4 fill-signal text-graphite" />
              <span>4.9 / 5.0 (38 Corporate Reviews)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-ivory p-5 rounded-sm border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-signal text-graphite" />
                  ))}
                </div>
                <span className="text-[11px] text-stone font-tabular">August 2026</span>
              </div>
              <p className="text-xs text-graphite leading-relaxed italic">
                "{broker.name} helped us close on a large industrial plot with a clean title. The paperwork transfer went through without any friction."
              </p>
              <div className="pt-2 border-t border-line text-xs font-tabular">
                <span className="font-bold text-graphite block">VP Corporate Infrastructure</span>
                <span className="text-stone">Global Auto Component Manufacturer</span>
              </div>
            </div>

            <div className="bg-ivory p-5 rounded-sm border border-line space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-signal text-graphite" />
                  ))}
                </div>
                <span className="text-[11px] text-stone font-tabular">June 2026</span>
              </div>
              <p className="text-xs text-graphite leading-relaxed italic">
                "Honest and deeply knowledgeable about local zoning laws, boundary litigations, and road widening reservations. Highly recommend for any corporate land acquisition in Maharashtra."
              </p>
              <div className="pt-2 border-t border-line text-xs font-tabular">
                <span className="font-bold text-graphite block">Director of Real Estate</span>
                <span className="text-stone">National Logistics & Cold Storage REIT</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
