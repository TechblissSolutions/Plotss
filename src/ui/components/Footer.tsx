'use client';
import { T, Show } from '../content';
import React from 'react';
import Link from 'next/link';
import { ScreenId } from '../types';

interface FooterProps {
  onNavigate: (screen: ScreenId) => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="paint-graphite text-ivory border-t border-ink-4 pt-14 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4-column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-ink-4">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm paint-clay flex items-center justify-center text-ivory">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" stroke="var(--c-signal)" />
                  <polyline points="2 17 12 22 22 17" stroke="var(--c-ivory)" />
                </svg>
              </div>
              <span className="font-serif-headline text-2xl font-bold tracking-tight text-ivory">
                <T k="footer.plotss">PLOTSS</T>
              </span>
            </div>
            
            <p className="text-sm text-mist max-w-sm leading-relaxed">
              <T k="footer.india-s-premier-ai-powered-marketplace">A land marketplace for Ghaziabad, Noida and New Delhi. Find industrial, commercial and residential land, and contact owners directly.</T>
            </p>

            <div className="flex items-center gap-3 text-xs text-signal font-tabular">
              <span className="w-2 h-2 rounded-full paint-signal" />
              <span>AI-assisted search • Every listing is checked before it goes live</span>
            </div>

            <Show k="footer.rera-badges">
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="bg-ink-3 text-mist px-2.5 py-1 rounded-[3px] border border-ink-2">
                <T k="footer.maharera-compliant">MAHARERA Compliant</T>
              </span>
              <span className="bg-ink-3 text-mist px-2.5 py-1 rounded-[3px] border border-ink-2">
                <T k="footer.gujrera-verified">GUJRERA Verified</T>
              </span>
              <span className="bg-ink-3 text-mist px-2.5 py-1 rounded-[3px] border border-ink-2">
                <T k="footer.tnrera-registered">TNRERA Registered</T>
              </span>
            </div>
            </Show>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-ivory tracking-wider font-tabular">
              <T k="footer.land-categories">Land categories</T>
            </h4>
            <ul className="space-y-2 text-sm text-mist">
              <li><Link href="/category/industrial" className="hover:text-ivory transition-colors"><T k="footer.cat.industrial">Industrial land</T></Link></li>
              <li><Link href="/category/warehousing" className="hover:text-ivory transition-colors"><T k="footer.cat.warehousing">Warehousing land</T></Link></li>
              <li><Link href="/category/commercial" className="hover:text-ivory transition-colors"><T k="footer.cat.commercial">Commercial land</T></Link></li>
              <li><Link href="/category/residential" className="hover:text-ivory transition-colors"><T k="footer.cat.residential">Residential plots</T></Link></li>
              <li><Link href="/search" className="hover:text-ivory transition-colors"><T k="footer.cat.all">All listings</T></Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-ivory tracking-wider font-tabular">
              <T k="footer.top-micro-markets">Cities</T>
            </h4>
            <ul className="space-y-2 text-sm text-mist">
              <li><Link href="/city/ghaziabad" className="hover:text-ivory transition-colors"><T k="footer.city.ghaziabad">Land in Ghaziabad</T></Link></li>
              <li><Link href="/city/noida" className="hover:text-ivory transition-colors"><T k="footer.city.noida">Land in Noida</T></Link></li>
              <li><Link href="/city/new-delhi" className="hover:text-ivory transition-colors"><T k="footer.city.delhi">Land in New Delhi</T></Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-ivory tracking-wider font-tabular">
              <T k="footer.platform-due-diligence">Company</T>
            </h4>
            <ul className="space-y-2 text-sm text-mist">
              <li><Link href="/post-listing" className="hover:text-ivory transition-colors"><T k="footer.post">Post a listing (free)</T></Link></li>
              <li><Link href="/blog" className="hover:text-ivory transition-colors"><T k="footer.journal">Market Insights</T></Link></li>
              <li><Link href="/about" className="hover:text-ivory transition-colors"><T k="footer.company.about">About us</T></Link></li>
              <li><Link href="/contact" className="hover:text-ivory transition-colors"><T k="footer.company.contact">Contact</T></Link></li>
              <li><Link href="/faq" className="hover:text-ivory transition-colors"><T k="footer.company.faq">FAQ</T></Link></li>
                          </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone">
          <div>
            © {new Date().getFullYear()} PLOTSS. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/about" className="hover:text-mist"><T k="footer.about">About</T></Link>
            <Link href="/contact" className="hover:text-mist"><T k="footer.contact">Contact</T></Link>
            <Link href="/faq" className="hover:text-mist"><T k="footer.faq">FAQ</T></Link>
            <Link href="/terms" className="hover:text-mist"><T k="footer.terms">Terms of Service</T></Link>
            <Link href="/privacy" className="hover:text-mist"><T k="footer.privacy">Privacy Policy</T></Link>
            <Link href="/rera-disclaimer" className="hover:text-mist"><T k="footer.rera">RERA Disclaimer</T></Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
