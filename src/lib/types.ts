export type CategorySlug = "industrial" | "commercial" | "residential";
export type ListingType = "sale" | "lease" | "rent";
export type AreaUnit = "sqft" | "acre" | "sqm";
export type PropertyStatus = "draft" | "pending" | "live" | "sold" | "rejected";
export type Role = "buyer" | "seller" | "broker" | "admin";
export type DocStatus = "pending" | "verified" | "rejected";

export type VerificationDoc = { doc_type: string; status: DocStatus };

export type Owner = { id: string; name: string; phone: string; role: "seller" | "broker"; years?: number };

export type Property = {
  id: string;
  slug: string;
  title: string;
  description: string;
  ai_description?: string;
  listing_type: ListingType;
  category: CategorySlug;
  city: string; // city slug
  cityName: string;
  state: string;
  address: string;
  price: number; // INR
  area_value: number;
  area_unit: AreaUnit;
  road_width_ft: number;
  zone_type: string;
  status: PropertyStatus;
  is_verified: boolean;
  owner: Owner;
  verification: VerificationDoc[];
  views: number;
  enquiries: number;
  created_at: string;
};

export type City = { slug: string; name: string; state: string };
export type Category = { slug: CategorySlug; name: string; blurb: string };

/** brokerId identifies the client/business this login manages listings for (multi-staff agency accounts). */
export type Session = {
  id: string;
  name: string;
  /** @deprecated Use capability booleans; kept for backward compatibility during transition. */
  role: Role;
  phone?: string;
  /** Source of truth is account_capabilities.broker_id during transition. */
  brokerId?: string;
  // Capability flags — derived from account_capabilities table
  canBuy: boolean;
  canSell: boolean;
  isBrokerStaff: boolean;
  isAdmin: boolean;
  /** True once the user has completed (or skipped) the onboarding flow. */
  isOnboarded: boolean;
};

/** Structured filters parsed from a natural-language query or URL params. */
export type Filters = {
  q?: string;
  city?: string;
  category?: CategorySlug;
  listing_type?: ListingType;
  maxPrice?: number; // INR
  minPrice?: number;
  /** what the buyer literally asked for, used for match scoring */
  targetAcres?: number;
  minAcres?: number;
  maxAcres?: number;
  zone?: string;
};
