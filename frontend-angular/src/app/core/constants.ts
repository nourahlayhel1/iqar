import { Currency, PropertyPurpose, PropertySource, PropertyType } from './models';

export const PROPERTY_TYPES: PropertyType[] = ['apartment', 'villa', 'land', 'shop', 'office', 'other'];
export const PROPERTY_PURPOSES: PropertyPurpose[] = ['sale', 'rent'];
export const CURRENCIES: Currency[] = ['USD', 'LBP', 'SAR'];
export const PROPERTY_SOURCES: PropertySource[] = ['direct_owner', 'broker'];
export const PROPERTY_STATUSES = ['For Sale', 'For Rent'];
export const PROPERTY_CONDITIONS = ['New', 'Good', 'Needs Renovation'];
export const COMMON_AMENITIES = [
  'sea_view',
  'elevator',
  'generator',
  'parking',
  'storage',
  'balcony',
  'garden',
  'security',
  'pool',
  'furnished',
  'road_access',
  'water',
  'electricity'
];

export const PROPERTY_AMENITIES_BY_TYPE: Record<PropertyType, string[]> = {
  apartment: ['sea_view', 'elevator', 'generator', 'parking', 'storage', 'balcony', 'security', 'furnished'],
  villa: ['sea_view', 'generator', 'parking', 'storage', 'balcony', 'garden', 'security', 'pool', 'furnished'],
  land: ['sea_view', 'road_access', 'water', 'electricity'],
  shop: ['generator', 'parking', 'storage', 'security', 'water', 'electricity'],
  office: ['elevator', 'generator', 'parking', 'storage', 'security', 'furnished'],
  other: COMMON_AMENITIES
};

export const PROPERTY_TYPES_WITH_BEDROOMS: PropertyType[] = ['apartment', 'villa'];
export const PROPERTY_TYPES_WITH_BATHROOMS: PropertyType[] = ['apartment', 'villa', 'shop', 'office', 'other'];
