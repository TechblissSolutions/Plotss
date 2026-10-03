export type ListingCategory = 'Industrial' | 'Commercial' | 'Residential' | 'Warehousing';
export type ListingType = 'Buy' | 'Lease' | 'Rent';
export type ZoneType = 
  | 'Industrial (Heavy/Chemical)' 
  | 'Industrial (Light/Engineering)' 
  | 'Warehousing & Logistics' 
  | 'Commercial IT/SEZ' 
  | 'Commercial Mixed-Use' 
  | 'Residential NA (R-Zone)' 
  | 'Agricultural / Future Urban';

export interface VerificationDocument {
  id: string;
  name: string;
  category: string;
  status: 'verified' | 'pending' | 'action_required';
  verifiedDate?: string;
  documentRef?: string;
  description: string;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  category: ListingCategory;
  listingType: ListingType;
  zoneType: ZoneType;
  price: number; // In Rupees
  priceDisplay: string; // e.g. "₹ 4.80 Cr"
  pricePerUnit: string; // e.g. "₹ 1.60 Cr / Acre"
  area: number; // numeric value
  areaUnit: 'Acres' | 'Sq.Ft' | 'Guntas';
  areaDisplay: string; // e.g. "3.00 Acres (1,30,680 sq.ft)"
  city: string;
  microMarket: string;
  state: string;
  roadWidth: string; // e.g. "30m 4-Lane Industrial Corridor"
  frontage: string; // e.g. "180 ft frontage"
  powerSanction: string; // e.g. "33 KV Substation Line Adjacent"
  waterAvailability: string; // e.g. "Municipal pipeline connection"
  farFsi: string; // e.g. "1.50 (Extendable to 2.0 with TDR)"
  aiMatchScore: number; // e.g. 96
  matchReasons: string[];
  verified: boolean;
  verificationDate: string;
  ownerMaskedName: string;
  ownerMaskedPhone: string;
  ownerFullName: string;
  ownerPhone: string;
  ownerType: 'Broker' | 'Direct Owner' | 'Institutional Fund';
  brokerId?: string;
  plotGeometryType: 'rectangular' | 'corner' | 'l-shaped' | 'linear-highway';
  fairnessRating: 'Good Value' | 'Fair Market' | 'Premium Location';
  fairnessDelta: string; // e.g. "7.4% below corridor average"
  connectivity: {
    highway: string;
    expresswayDistance: string;
    portOrRailDistance: string;
    airportDistance: string;
  };
  nearbyClusters: string[];
  documents: VerificationDocument[];
  rawDescription?: string;
  aiDescription: string;
  priceHistory: { year: string; pricePerAcre: number }[];
  status: 'live' | 'pending' | 'draft' | 'sold';
  viewsCount: number;
  enquiriesCount: number;
  createdAt: string;
  realImageUrl?: string;
  /** Passed the automatic risk screen (only set when AI screening is switched on). */
  aiScreened?: boolean;
  lat?: number;
  lng?: number;
  galleryImages?: string[];
}

export interface CityInfo {
  name: string;
  state: string;
  plotCount: number;
  avgPricePerAcre: string;
  popularHubs: string[];
}

export interface BrokerProfile {
  id: string;
  name: string;
  firmName: string;
  reraNumber: string;
  photoUrl?: string;
  yearsActive: number;
  propertiesListed: number;
  propertiesClosed: number;
  verified: boolean;
  rating: number;
  reviewCount: number;
  cities: string[];
  phone: string;
  email: string;
  bio: string;
  specializations: string[];
}

export interface LeadItem {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerName: string;
  buyerPhone: string;
  buyerBudget: string;
  intent: 'Immediate Acquisition' | '6-Month Plan' | 'Lease Evaluation';
  unlockedAt: string;
  status: 'New' | 'Contacted' | 'Site Visit Scheduled' | 'Deal Closed';
}

export type ScreenId = 
  | 'home' 
  | 'search' 
  | 'property_detail' 
  | 'post_property' 
  | 'buyer_dashboard' 
  | 'seller_dashboard' 
  | 'broker_dashboard' 
  | 'admin_panel' 
  | 'broker_profile';

export type UserRole = 'buyer' | 'seller' | 'broker' | 'admin';

/** Structured search intent produced by the AI (or rule) parser on the server. */
export interface ParsedQuery {
  city?: string; category?: string; listing_type?: string;
  maxPrice?: number; minPrice?: number; targetAcres?: number; minAcres?: number; maxAcres?: number; zone?: string;
}
