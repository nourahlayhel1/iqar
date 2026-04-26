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
  apartment: [
    'wifi',
    'air_conditioning',
    'heating',
    'hot_water',
    'essentials',
    'washing_machine',
    'dryer',
    'iron',
    'hair_dryer',
    'generator',
    'full_kitchen',
    'refrigerator',
    'stove',
    'oven',
    'microwave',
    'coffee_maker',
    'kettle',
    'dishwasher',
    'dining_area',
    'bbq_grill',
    'extra_pillows_blankets',
    'wardrobe_closet',
    'blackout_curtains',
    'baby_crib',
    'safe',
    'pool',
    'garden',
    'balcony',
    'terrace',
    'sea_view',
    'mountain_view',
    'private_entrance',
    'elevator',
    'parking',
    'smart_tv',
    'streaming_services',
    'fireplace',
    'outdoor_seating_area',
    'hammock',
    'workspace_desk',
    'gym',
    'jacuzzi_hot_tub',
    'pet_friendly',
    'smoking_allowed',
    'security_system',
    'first_aid_kit',
    'fire_extinguisher',
    'smoke_detector',
    'board_games',
    'books',
    'playground'
  ],
  villa: ['sea_view', 'generator', 'parking', 'storage', 'balcony', 'garden', 'security', 'pool', 'furnished'],
  land: [
    'road_access_paved_unpaved',
    'corner_plot',
    'facing_direction',
    'view_sea_mountain_city',
    'electricity_availability',
    'water_connection',
    'sewage_system',
    'internet_telecom_access',
    'near_main_road_highway',
    'close_to_schools',
    'close_to_hospitals',
    'nearby_shops_supermarkets',
    'distance_to_city_center',
    'zoning_residential_commercial_agricultural',
    'building_permit_availability',
    'investment_ratio',
    'title_deed_status',
    'gated_area',
    'security',
    'landscaping_trees',
    'land_type_flat_sloped',
    'subdivision_potential'
  ],
  shop: ['generator', 'parking', 'storage', 'security', 'water', 'electricity'],
  office: ['elevator', 'generator', 'parking', 'storage', 'security', 'furnished'],
  other: COMMON_AMENITIES
};

export const PROPERTY_TYPES_WITH_BEDROOMS: PropertyType[] = ['apartment', 'villa'];
export const PROPERTY_TYPES_WITH_BATHROOMS: PropertyType[] = ['apartment', 'villa', 'shop', 'office', 'other'];
