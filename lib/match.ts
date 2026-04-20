import type { CustomerRequest, Property } from "@/lib/types";

export function propertyMatchesRequest(property: Property, request: CustomerRequest): boolean {
  if (property.type !== request.requestType) {
    return false;
  }

  if (property.purpose !== request.purpose) {
    return false;
  }

  if (request.preferredLocations.length > 0) {
    const locationMatch = request.preferredLocations.some((location) => {
      const cityMatches = property.location.city.toLowerCase() === location.city.toLowerCase();
      const areaMatches = !location.area || property.location.area?.toLowerCase() === location.area.toLowerCase();
      return cityMatches && areaMatches;
    });

    if (!locationMatch) {
      return false;
    }
  }

  if (request.minPrice !== undefined && property.price < request.minPrice) {
    return false;
  }

  if (request.maxPrice !== undefined && property.price > request.maxPrice) {
    return false;
  }

  if (request.minBedrooms !== undefined && (property.bedrooms ?? 0) < request.minBedrooms) {
    return false;
  }

  if (request.minBathrooms !== undefined && (property.bathrooms ?? 0) < request.minBathrooms) {
    return false;
  }

  if (request.minAreaSqm !== undefined && (property.areaSqm ?? 0) < request.minAreaSqm) {
    return false;
  }

  if (request.mustHaveAmenities?.length) {
    const propertyAmenities = new Set(property.amenities.map((amenity) => amenity.toLowerCase()));
    const hasAllAmenities = request.mustHaveAmenities.every((amenity) =>
      propertyAmenities.has(amenity.toLowerCase())
    );

    if (!hasAllAmenities) {
      return false;
    }
  }

  return true;
}

export function findMatchesForRequest(properties: Property[], request: CustomerRequest): Property[] {
  return properties.filter((property) => propertyMatchesRequest(property, request));
}
