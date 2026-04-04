export type PropertyType = 'apartment' | 'villa' | 'land' | 'shop' | 'office' | 'other';
export type PropertyPurpose = 'sale' | 'rent';
export type PropertySource = 'direct_owner' | 'broker';
export type Currency = 'USD' | 'LBP' | 'SAR';

export interface PropertyLocation {
  country: string;
  city: string;
  area: string;
  address?: string;
  lat?: number;
  lng?: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  purpose: PropertyPurpose;
  price: number;
  currency: Currency;
  location: PropertyLocation;
  propertyCode?: string;
  propertyNumber?: number;
  source?: PropertySource;
  agentName?: string;
  listingStatus?: string;
  zoning?: string;
  pricePerSqm?: number;
  condition?: string;
  age?: string;
  negotiable?: boolean;
  notes?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  floor?: number;
  parking?: boolean;
  furnished?: boolean;
  amenities: string[];
  coverImage?: string;
  images: string[];
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerDocument {
  name: string;
  url: string;
}

export interface Owner {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  notes?: string;
  documents: OwnerDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface RequestLocation {
  city: string;
  area?: string;
}

export interface CustomerRequest {
  id: string;
  customerId: string;
  requestType: PropertyType;
  purpose: PropertyPurpose;
  preferredLocations: RequestLocation[];
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minAreaSqm?: number;
  mustHaveAmenities?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyQuery {
  q?: string;
  country?: string;
  city?: string;
  area?: string;
  types?: string[];
  purpose?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  amenities?: string[];
  sort?: 'newest' | 'oldest' | 'priceAsc' | 'priceDesc';
}
