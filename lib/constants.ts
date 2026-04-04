import type { Currency, PropertyPurpose, PropertySource, PropertyType } from "@/lib/types";

export const PROPERTY_TYPES: PropertyType[] = ["apartment", "villa", "land", "shop", "office", "other"];
export const PROPERTY_PURPOSES: PropertyPurpose[] = ["sale", "rent"];
export const PROPERTY_SOURCES: PropertySource[] = ["direct_owner", "broker"];
export const PROPERTY_SOURCE_LABELS: Record<PropertySource, string> = {
  direct_owner: "Direct owner",
  broker: "Broker"
};
export const CURRENCIES: Currency[] = ["USD", "LBP", "SAR"];
export const COMMON_AMENITIES = [
  "sea_view",
  "elevator",
  "generator",
  "parking",
  "storage",
  "balcony",
  "garden",
  "security",
  "pool",
  "furnished"
];
