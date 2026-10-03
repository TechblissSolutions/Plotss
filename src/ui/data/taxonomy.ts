import type { Listing, ListingCategory } from '../types';

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const CATEGORY_LIST: { slug: string; name: ListingCategory; blurb: string }[] = [
  { slug: 'industrial', name: 'Industrial', blurb: 'Industrial plots and land with power, road access and zoning details' },
  { slug: 'warehousing', name: 'Warehousing', blurb: 'Logistics and warehousing land near highways and freight corridors' },
  { slug: 'commercial', name: 'Commercial', blurb: 'Commercial and mixed-use land listings' },
  { slug: 'residential', name: 'Residential', blurb: 'Residential plots and plotted developments in growth corridors' },
];

export const listingsInCity = (all: Listing[], cityName: string): Listing[] =>
  all.filter((l) => l.city.toLowerCase().trim().startsWith(cityName.toLowerCase()));
export const listingsInCategory = (all: Listing[], name: string): Listing[] => all.filter((l) => l.category === name);
