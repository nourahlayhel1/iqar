import { matchesGlobalSearch } from "@/lib/search";
import type { Property, PropertyFilters } from "@/lib/types";

export function filterAndSortProperties(properties: Property[], filters: PropertyFilters): Property[] {
  const filtered = properties.filter((property) => {
    if (!matchesGlobalSearch(property, filters.q)) return false;
    if (filters.country && property.location.country.toLowerCase() !== filters.country.toLowerCase()) return false;
    if (filters.city && property.location.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.area && property.location.area.toLowerCase() !== filters.area.toLowerCase()) return false;
    if (filters.types?.length && !filters.types.includes(property.type)) return false;
    if (filters.purpose && property.purpose !== filters.purpose) return false;
    if (filters.minPrice !== undefined && property.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && property.price > filters.maxPrice) return false;
    if (filters.minBedrooms !== undefined && (property.bedrooms ?? 0) < filters.minBedrooms) return false;

    if (filters.amenities?.length) {
      const propertyAmenities = new Set(property.amenities.map((amenity) => amenity.toLowerCase()));
      if (!filters.amenities.every((amenity) => propertyAmenities.has(amenity.toLowerCase()))) return false;
    }

    return true;
  });

  return filtered.sort((left, right) => {
    switch (filters.sort) {
      case "oldest":
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      case "priceAsc":
        return left.price - right.price;
      case "priceDesc":
        return right.price - left.price;
      case "newest":
      default:
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
  });
}

export function propertyFiltersFromSearchParams(searchParams: URLSearchParams): PropertyFilters {
  const parseNumber = (value: string | null): number | undefined => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  return {
    q: searchParams.get("q") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    area: searchParams.get("area") ?? undefined,
    types: searchParams.getAll("types"),
    purpose: searchParams.get("purpose") ?? undefined,
    minPrice: parseNumber(searchParams.get("minPrice")),
    maxPrice: parseNumber(searchParams.get("maxPrice")),
    minBedrooms: parseNumber(searchParams.get("minBedrooms")),
    amenities: searchParams.getAll("amenities"),
    sort: (searchParams.get("sort") as PropertyFilters["sort"]) ?? "newest"
  };
}
