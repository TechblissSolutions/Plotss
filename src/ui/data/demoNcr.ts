import { MOCK_LISTINGS } from './mockData';
import type { Listing, VerificationDocument } from '../types';

/**
 * DEMO listings for the launch geography (Ghaziabad, Noida, New Delhi).
 * They reuse the prototype's layout data but every place name, title and description is rewritten for NCR, price
 * trends / match scores / fairness claims are removed, and documents are generic. Owner names and numbers are
 * fictional. These must be replaced by real listings before launch (see docs/20-launch-checklist.md).
 */
type Override = Partial<Listing> & { key: string };

const conn = (highway: string): Listing['connectivity'] => ({ highway, expresswayDistance: '', portOrRailDistance: '', airportDistance: '' });

const OVERRIDES: Override[] = [
  {
    key: 'hinjawadi', slug: 'raj-nagar-extension-residential-plot-ghaziabad', city: 'Ghaziabad', state: 'Uttar Pradesh', microMarket: 'Raj Nagar Extension',
    title: '500 sq yd residential plot in Raj Nagar Extension, Ghaziabad', tagline: 'Demo listing · approved layout, corner plot',
    connectivity: conn('Access from the NH-9 / Delhi-Meerut Expressway corridor'), nearbyClusters: ['Raj Nagar Extension township'],
    aiDescription: 'Demo listing. Residential plot in an approved layout in Raj Nagar Extension, Ghaziabad. Replace with a real listing before launch.',
  },
  {
    key: 'lonavala', slug: 'yamuna-expressway-farm-plot-greater-noida', city: 'Noida', state: 'Uttar Pradesh', microMarket: 'Yamuna Expressway belt, Greater Noida',
    title: '1.25 acre plot on the Yamuna Expressway belt, Greater Noida', tagline: 'Demo listing · road-facing, open plot',
    connectivity: conn('Yamuna Expressway'), nearbyClusters: ['Yamuna Expressway sectors'],
    aiDescription: 'Demo listing. Open plot on the Yamuna Expressway belt near Greater Noida. Replace with a real listing before launch.',
  },
  {
    key: 'chakan', slug: 'sahibabad-industrial-area-plot-ghaziabad', city: 'Ghaziabad', state: 'Uttar Pradesh', microMarket: 'Sahibabad Industrial Area',
    title: '3 acre industrial plot in Sahibabad Industrial Area, Ghaziabad', tagline: 'Demo listing · road-facing, power available',
    connectivity: conn('Close to the NH-9 / NH-24 corridor'), nearbyClusters: ['Sahibabad Industrial Area', 'Site IV'],
    aiDescription: 'Demo listing. Industrial plot in the Sahibabad Industrial Area, Ghaziabad. Replace with a real listing before launch.',
  },
  {
    key: 'sanand', slug: 'loni-meerut-road-industrial-land-ghaziabad', city: 'Ghaziabad', state: 'Uttar Pradesh', microMarket: 'Meerut Road industrial belt',
    title: '5 acre industrial land on Meerut Road, Ghaziabad', tagline: 'Demo listing · wide frontage, rail access nearby',
    connectivity: conn('Meerut Road / NH-58 corridor'), nearbyClusters: ['Meerut Road industrial belt', 'Loni'],
    aiDescription: 'Demo listing. Larger industrial parcel on the Meerut Road belt in Ghaziabad. Replace with a real listing before launch.',
  },
  {
    key: 'bhiwandi', slug: 'narela-bawana-warehouse-land-new-delhi', city: 'New Delhi', state: 'Delhi', microMarket: 'Narela / Bawana industrial belt',
    title: '3.4 acre warehousing land near Narela-Bawana, New Delhi', tagline: 'Demo listing · truck access, logistics use',
    connectivity: conn('Narela-Bawana road network, KMP access'), nearbyClusters: ['Narela', 'Bawana'],
    aiDescription: 'Demo listing. Warehousing land in the Narela-Bawana belt of north-west Delhi. Replace with a real listing before launch.',
  },
  {
    key: 'devanahalli', slug: 'sector-135-plotted-development-noida', city: 'Noida', state: 'Uttar Pradesh', microMarket: 'Sector 135, Noida',
    title: '200 sq yd residential plot near Sector 135, Noida', tagline: 'Demo listing · plotted development',
    connectivity: conn('Noida-Greater Noida Expressway'), nearbyClusters: ['Sector 135', 'Noida Expressway'],
    aiDescription: 'Demo listing. Residential plot near Sector 135 on the Noida Expressway. Replace with a real listing before launch.',
  },
  {
    key: 'alibaug', slug: 'chhatarpur-farmhouse-belt-plot-new-delhi', city: 'New Delhi', state: 'Delhi', microMarket: 'Chhatarpur',
    title: '1,000 sq yd plot in the Chhatarpur belt, New Delhi', tagline: 'Demo listing · large residential plot',
    connectivity: conn('Mehrauli-Gurgaon Road'), nearbyClusters: ['Chhatarpur', 'Mehrauli'],
    aiDescription: 'Demo listing. Large residential plot in the Chhatarpur area of south Delhi. Replace with a real listing before launch.',
  },
  {
    key: 'sriperumbudur', slug: 'ecotech-surajpur-industrial-plot-greater-noida', city: 'Noida', state: 'Uttar Pradesh', microMarket: 'Ecotech / Surajpur, Greater Noida',
    title: '7.5 acre industrial land near Ecotech, Greater Noida', tagline: 'Demo listing · light engineering zone',
    connectivity: conn('Greater Noida arterial roads, NH-91 access'), nearbyClusters: ['Ecotech', 'Surajpur'],
    aiDescription: 'Demo listing. Industrial land near the Ecotech / Surajpur area of Greater Noida. Replace with a real listing before launch.',
  },
  {
    key: 'hosur', slug: 'noida-expressway-commercial-parcel-noida', city: 'Noida', state: 'Uttar Pradesh', microMarket: 'Noida-Greater Noida Expressway',
    title: '3.4 acre commercial parcel on the Noida Expressway', tagline: 'Demo listing · commercial / IT use',
    connectivity: conn('Noida-Greater Noida Expressway'), nearbyClusters: ['Expressway sectors'],
    aiDescription: 'Demo listing. Commercial parcel along the Noida-Greater Noida Expressway. Replace with a real listing before launch.',
  },
  {
    key: 'noida', slug: 'nh-24-indirapuram-residential-plots-ghaziabad', city: 'Ghaziabad', state: 'Uttar Pradesh', microMarket: 'NH-24, near Indirapuram',
    title: '2 acre residential plotted land near Indirapuram, Ghaziabad', tagline: 'Demo listing · plotted development',
    connectivity: conn('NH-24 / NH-9'), nearbyClusters: ['Indirapuram', 'Vaishali'],
    aiDescription: 'Demo listing. Residential plotted land near Indirapuram on the NH-24 corridor. Replace with a real listing before launch.',
  },
];

const genericDocs = (i: number): VerificationDocument[] => [
  { id: `d-${i}-1`, name: 'Ownership document', category: 'Ownership', status: 'pending', description: 'Sale deed / allotment letter. Demo entry.' },
  { id: `d-${i}-2`, name: 'Revenue record (khatauni / equivalent)', category: 'Revenue record', status: 'pending', description: 'Demo entry.' },
];

export const NCR_DEMO_LISTINGS: Listing[] = MOCK_LISTINGS.map((l, i) => {
  const o = OVERRIDES.find((x) => l.slug.includes(x.key)) ?? OVERRIDES[i % OVERRIDES.length];
  const { key, ...rest } = o;
  void key;
  return {
    ...l,
    ...rest,
    ownerType: 'Direct Owner',
    brokerId: undefined,
    aiMatchScore: 0,
    matchReasons: [],
    fairnessRating: 'Fair Market',
    fairnessDelta: '',
    priceHistory: [],
    documents: genericDocs(i),
    verified: false,
    verificationDate: '',
    farFsi: '',
    powerSanction: '',
    waterAvailability: '',
    frontage: '',
    roadWidth: l.roadWidth.replace(/MIDC|GIDC|SIPCOT|MSEDCL/g, '').trim(),
  };
});
