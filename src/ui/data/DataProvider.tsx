'use client';
import React, { createContext, useContext } from 'react';
import type { Features } from '@/lib/features-shared';
import type { BrokerProfile, CityInfo, Listing } from '../types';

export type BlogCard = { id: string; slug: string; title: string; tag: string; date: string; readTime: string; excerpt: string };
export type SiteStats = { plots: string; cities: string; deals: string };

export type SiteData = {
  listings: Listing[];
  brokers: BrokerProfile[];
  cities: CityInfo[];
  blog: BlogCard[];
  stats: SiteStats;
  categoryCounts: Record<string, number>;
  features: Features;
  cityList: { slug: string; name: string }[];
};

const Ctx = createContext<SiteData | null>(null);
export const DataProvider = ({ value, children }: { value: SiteData; children: React.ReactNode }) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);
export const useData = (): SiteData => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useData outside DataProvider');
  return c;
};
