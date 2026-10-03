'use client';
import { T } from '../content';
import { useData } from '../data/DataProvider';
import Link from 'next/link';
import React from 'react';
import { ScreenId, UserRole } from '../types';
import { 
  Building2, 
  MapPin, 
  PlusCircle, 
  User, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  Menu, 
  X,
  ChevronDown,
  Sparkles,
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId, slug?: string) => void;
  userRole: UserRole;
  onChangeRole?: (role: UserRole) => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
  onLogout: () => void;
  isMobileView?: boolean;
  onToggleMobileView?: () => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  userRole,
  onChangeRole,
  isLoggedIn,
  onOpenAuth,
  onLogout,
  isMobileView,
  onToggleMobileView,
  savedCount,
}) => {
  const { features } = useData();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [screensDropdownOpen, setScreensDropdownOpen] = React.useState(false);

  const screens: { id: ScreenId; label: string; number: number }[] = [
    { id: 'home', label: '1. Homepage', number: 1 },
    { id: 'search', label: '2. Search Results', number: 2 },
    { id: 'property_detail', label: '3. Property Detail', number: 3 },
    { id: 'post_property', label: '5. Post Listing Flow', number: 5 },
    { id: 'buyer_dashboard', label: '6a. Buyer Dashboard', number: 6 },
    { id: 'seller_dashboard', label: '6b. Seller Dashboard', number: 6 },
    { id: 'broker_dashboard', label: '6c. Broker Dashboard', number: 6 },
    { id: 'admin_panel', label: '7. Admin Panel', number: 7 },
    { id: 'broker_profile', label: '8. Broker Profile', number: 8 },
  ];

  return (
    <>

      {/* Main Brand Header */}
      <header className="sticky top-0 z-40 bg-ivory border-b border-line transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Brand System */}
          <div className="flex items-center gap-3">
            <button
              id="brand-home-link"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              {/* Minimalist 3D wireframe plot mark */}
              <div className="w-8 h-8 rounded-sm paint-graphite border border-graphite flex items-center justify-center text-ivory shadow-sm group-hover:border-clay transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" stroke="var(--c-signal)" />
                  <polyline points="2 17 12 22 22 17" stroke="var(--c-ivory)" />
                  <polyline points="2 12 12 17 22 12" stroke="var(--c-clay)" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-serif-headline text-2xl font-bold tracking-tight text-graphite leading-none">
                  <T k="header.plotss">PLOTSS</T>
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-stone font-tabular uppercase mt-0.5">
                  <T k="header.india-s-ai-land-marketplace">India's AI Land Marketplace</T>
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-graphite">
            <button
              id="nav-search-link"
              onClick={() => onNavigate('search')}
              className={`hover:text-clay transition-colors cursor-pointer ${
                currentScreen === 'search' ? 'text-clay font-semibold' : ''
              }`}
            >
              <T k="header.explore-plots">Explore Plots</T>
            </button>
            <button
              id="nav-industrial-link"
              onClick={() => onNavigate('search')}
              className="hover:text-clay transition-colors cursor-pointer"
            >
              <T k="header.industrial-land">Industrial Land</T>
            </button>
            <button
              id="nav-warehousing-link"
              onClick={() => onNavigate('search')}
              className="hover:text-clay transition-colors cursor-pointer"
            >
              <T k="header.warehouses-logistics">Warehouses & Logistics</T>
            </button>
            {features.brokers && (
            <button
              id="nav-brokers-link"
              onClick={() => onNavigate('broker_profile')}
              className={`hover:text-clay transition-colors cursor-pointer ${
                currentScreen === 'broker_profile' ? 'text-clay font-semibold' : ''
              }`}
            >
              <T k="header.verified-brokers">Verified Brokers</T>
            </button>
            )}
            <Link id="nav-insights-link" href="/blog" className="hover:text-clay transition-colors">
              <T k="header.market-insights">Market Insights</T>
            </Link>
          </nav>

          {/* Actions: Post Property + Dashboard / Login */}
          <div className="flex items-center gap-3">
            {/* Post Property Button */}
            <button
              id="header-post-property-btn"
              onClick={() => onNavigate('post_property')}
              className="hidden sm:inline-flex items-center gap-1.5 paint-clay hover:bg-clay-dark text-ivory text-xs font-semibold px-3.5 py-2 rounded-sm border border-clay transition-colors cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post a Listing</span>
            </button>

            {/* Dashboard or Auth Button */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {userRole === 'admin' ? (
                  <a
                    id="header-dashboard-btn"
                    href="/admin"
                    target="_blank"
                    rel="noopener"
                    title="Opens the super admin panel in a new tab"
                    className="flex items-center gap-2 paint-graphite text-ivory hover:bg-ink-3 text-xs font-medium px-3 py-2 rounded-sm border border-graphite transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-signal" />
                    <span>Admin panel ↗</span>
                  </a>
                ) : (
                  <button
                    id="header-dashboard-btn"
                    onClick={() => onNavigate((userRole + '_dashboard') as ScreenId)}
                    className="flex items-center gap-2 paint-graphite text-ivory hover:bg-ink-3 text-xs font-medium px-3 py-2 rounded-sm border border-graphite transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-signal" />
                    <span>My dashboard</span>
                    {userRole === 'buyer' && savedCount > 0 && (
                      <span className="paint-clay text-[11px] font-bold px-1.5 py-0.2 rounded-full font-tabular">{savedCount}</span>
                    )}
                  </button>
                )}
                <button
                  id="header-logout-btn"
                  onClick={onLogout}
                  className="text-xs font-semibold text-graphite border border-line hover:border-graphite rounded-sm px-3 py-2 cursor-pointer"
                  title="Sign out"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <a
                id="header-login-btn"
                href="/login"
                className="inline-flex items-center gap-1.5 bg-transparent hover:paint-graphite text-graphite hover:text-ivory text-xs font-semibold px-3 py-2 rounded-sm border border-graphite transition-colors cursor-pointer"
              >
                <span>Login / Register</span>
              </a>
            )}

            {/* Mobile menu trigger */}
            <button
              id="mobile-menu-trigger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-graphite hover:bg-line rounded-sm cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-ivory border-b border-line px-4 pt-3 pb-5 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                onClick={() => { onNavigate('search'); setMobileMenuOpen(false); }}
                className="text-left py-2 px-2.5 rounded-sm bg-sand text-graphite"
              >
                <T k="header.explore-all-plots">Explore All Plots</T>
              </button>
              <button
                onClick={() => { onNavigate('post_property'); setMobileMenuOpen(false); }}
                className="text-left py-2 px-2.5 rounded-sm paint-clay text-ivory font-semibold"
              >
                + Post Property
              </button>
              <button
                onClick={() => { onNavigate('broker_profile'); setMobileMenuOpen(false); }}
                className="text-left py-2 px-2.5 rounded-sm border border-line text-graphite"
              >
                <T k="header.broker-profile">Broker Profile</T>
              </button>
              <Link
                href="/blog"
                onClick={() => setMobileMenuOpen(false)}
                className="text-left py-2 px-2.5 rounded-sm border border-line text-graphite"
              >
                <T k="header.market-insights">Market Insights</T>
              </Link>
            </div>

                      </div>
        )}
      </header>
    </>
  );
};
