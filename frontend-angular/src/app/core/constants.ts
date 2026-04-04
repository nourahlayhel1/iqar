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
  'furnished'
];
