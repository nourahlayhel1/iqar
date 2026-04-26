import { CURRENCIES, PROPERTY_PURPOSES, PROPERTY_SOURCES, PROPERTY_TYPES } from "@/lib/constants";
import type { Customer, CustomerRequest, Owner, Property, PropertySource } from "@/lib/types";

type ValidationResult<T> = { success: true; data: T } | { success: false; message: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === "number" && Number.isFinite(value));
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === "boolean";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNonNegativeNumber(value: number | undefined): boolean {
  return value === undefined || value >= 0;
}

export function validatePropertyInput(input: unknown): ValidationResult<Omit<Property, "id" | "createdAt" | "updatedAt">> {
  if (typeof input !== "object" || input === null) {
    return { success: false, message: "Invalid property payload." };
  }

  const value = input as Record<string, unknown>;

  if (!isNonEmptyString(value.title) || !isNonEmptyString(value.description)) {
    return { success: false, message: "Title and description are required." };
  }

  if (!PROPERTY_TYPES.includes(value.type as Property["type"])) {
    return { success: false, message: "Invalid property type." };
  }

  if (!PROPERTY_PURPOSES.includes(value.purpose as Property["purpose"])) {
    return { success: false, message: "Invalid property purpose." };
  }

  if (typeof value.source === "string" && !PROPERTY_SOURCES.includes(value.source as PropertySource)) {
    return { success: false, message: "Invalid property source." };
  }

  if (typeof value.price !== "number" || !Number.isFinite(value.price) || value.price < 0) {
    return { success: false, message: "Invalid property price." };
  }

  if (!CURRENCIES.includes(value.currency as Property["currency"])) {
    return { success: false, message: "Invalid currency." };
  }

  if (typeof value.location !== "object" || value.location === null) {
    return { success: false, message: "Location is required." };
  }

  const location = value.location as Record<string, unknown>;
  if (!isNonEmptyString(location.city)) {
    return { success: false, message: "City is required." };
  }

  if (!isStringArray(value.amenities) || !isStringArray(value.images)) {
    return { success: false, message: "Amenities and images must be arrays of strings." };
  }

  if (
    !isOptionalNumber(value.bedrooms) ||
    !isOptionalNumber(value.bathrooms) ||
    !isOptionalNumber(value.areaSqm) ||
    !isOptionalNumber(value.floor) ||
    !isOptionalNumber(value.propertyNumber) ||
    !isOptionalNumber(value.lotNumber) ||
    !isOptionalNumber(value.pricePerSqm) ||
    !isOptionalNumber(location.lat) ||
    !isOptionalNumber(location.lng) ||
    !isOptionalBoolean(value.parking) ||
    !isOptionalBoolean(value.furnished) ||
    !isOptionalBoolean(value.negotiable)
  ) {
    return { success: false, message: "Invalid numeric or boolean fields in property." };
  }

  if (
    !isNonNegativeNumber(value.bedrooms as number | undefined) ||
    !isNonNegativeNumber(value.bathrooms as number | undefined) ||
    !isNonNegativeNumber(value.areaSqm as number | undefined)
  ) {
    return { success: false, message: "Property counts and area must be non-negative." };
  }

  const ownerId = typeof value.ownerId === "string" ? value.ownerId.trim() : "";
  const ownerName = typeof value.ownerName === "string" ? value.ownerName.trim() : "";
  const ownerPhone = typeof value.ownerPhone === "string" ? value.ownerPhone.trim() : "";
  if (!ownerId && (!ownerName || !ownerPhone)) {
    return { success: false, message: "Please select an existing owner/broker or enter both name and phone." };
  }

  return {
    success: true,
    data: {
      title: value.title.trim() as string,
      description: value.description.trim() as string,
      type: value.type as Property["type"],
      purpose: value.purpose as Property["purpose"],
      price: value.price as number,
      currency: value.currency as Property["currency"],
      propertyCode: typeof value.propertyCode === "string" ? value.propertyCode.trim() : undefined,
      propertyNumber: value.propertyNumber as number | undefined,
      lotNumber: value.lotNumber as number | undefined,
      source: PROPERTY_SOURCES.includes(value.source as PropertySource)
        ? (value.source as PropertySource)
        : "direct_owner",
      agentName: typeof value.agentName === "string" ? value.agentName.trim() : undefined,
      listingStatus: typeof value.listingStatus === "string" ? value.listingStatus.trim() : undefined,
      zoning: typeof value.zoning === "string" ? value.zoning.trim() : undefined,
      pricePerSqm: value.pricePerSqm as number | undefined,
      condition: typeof value.condition === "string" ? value.condition.trim() : undefined,
      age: typeof value.age === "string" ? value.age.trim() : undefined,
      negotiable: value.negotiable as boolean | undefined,
      notes: typeof value.notes === "string" ? value.notes.trim() : undefined,
      location: {
        country: typeof location.country === "string" ? location.country.trim() || undefined : undefined,
        city: location.city.trim() as string,
        area: typeof location.area === "string" ? location.area.trim() || undefined : undefined,
        address: typeof location.address === "string" ? location.address.trim() || undefined : undefined,
        lat: location.lat as number | undefined,
        lng: location.lng as number | undefined
      },
      bedrooms: value.bedrooms as number | undefined,
      bathrooms: value.bathrooms as number | undefined,
      areaSqm: value.areaSqm as number | undefined,
      floor: value.floor as number | undefined,
      parking: value.parking as boolean | undefined,
      furnished: value.furnished as boolean | undefined,
      amenities: (value.amenities as string[]).map((item) => item.trim()).filter(Boolean),
      coverImage: typeof value.coverImage === "string" ? value.coverImage.trim() || undefined : undefined,
      images: (value.images as string[]).map((item) => item.trim()).filter(Boolean),
      ownerId: ownerId || undefined,
      ownerName: ownerName || undefined,
      ownerPhone: ownerPhone || undefined
    }
  };
}

export function validateCustomerInput(input: unknown): ValidationResult<Omit<Customer, "id" | "createdAt" | "updatedAt">> {
  if (typeof input !== "object" || input === null) {
    return { success: false, message: "Invalid customer payload." };
  }

  const value = input as Record<string, unknown>;
  if (!isNonEmptyString(value.name) || !isNonEmptyString(value.phone)) {
    return { success: false, message: "Name and phone are required." };
  }

  return {
    success: true,
    data: {
      name: value.name.trim() as string,
      phone: value.phone.trim() as string,
      altPhone: typeof value.altPhone === "string" ? value.altPhone.trim() : undefined,
      notes: typeof value.notes === "string" ? value.notes.trim() : undefined
    }
  };
}

export function validateOwnerInput(input: unknown): ValidationResult<Omit<Owner, "id" | "createdAt" | "updatedAt">> {
  if (typeof input !== "object" || input === null) {
    return { success: false, message: "Invalid owner payload." };
  }

  const value = input as Record<string, unknown>;
  if (!isNonEmptyString(value.name) || !isNonEmptyString(value.phone)) {
    return { success: false, message: "Name and phone are required." };
  }

  if (!Array.isArray(value.documents)) {
    return { success: false, message: "Documents must be an array." };
  }

  const documents = value.documents.map((document) => {
    if (typeof document !== "object" || document === null) {
      return null;
    }

    const current = document as Record<string, unknown>;
    if (!isNonEmptyString(current.name) || !isNonEmptyString(current.url)) {
      return null;
    }

    return {
      name: current.name.trim(),
      url: current.url.trim()
    };
  });

  if (documents.some((document) => !document)) {
    return { success: false, message: "Each document needs a name and URL." };
  }

  return {
    success: true,
    data: {
      name: value.name.trim(),
      phone: value.phone.trim(),
      altPhone: typeof value.altPhone === "string" ? value.altPhone.trim() : undefined,
      notes: typeof value.notes === "string" ? value.notes.trim() : undefined,
      documents: documents as Owner["documents"]
    }
  };
}

export function validateRequestInput(
  input: unknown
): ValidationResult<Omit<CustomerRequest, "id" | "createdAt" | "updatedAt">> {
  if (typeof input !== "object" || input === null) {
    return { success: false, message: "Invalid request payload." };
  }

  const value = input as Record<string, unknown>;
  if (!isNonEmptyString(value.customerId)) {
    return { success: false, message: "Customer is required." };
  }

  if (!PROPERTY_TYPES.includes(value.requestType as CustomerRequest["requestType"])) {
    return { success: false, message: "Invalid request type." };
  }

  if (!PROPERTY_PURPOSES.includes(value.purpose as CustomerRequest["purpose"])) {
    return { success: false, message: "Invalid request purpose." };
  }

  if (!Array.isArray(value.preferredLocations)) {
    return { success: false, message: "Preferred locations are required." };
  }

  const preferredLocations = value.preferredLocations.map((location) => {
    if (typeof location !== "object" || location === null) {
      return null;
    }

    const current = location as Record<string, unknown>;
    if (!isNonEmptyString(current.city)) {
      return null;
    }

    return {
      city: current.city.trim() as string,
      area: typeof current.area === "string" ? current.area.trim() : undefined
    };
  });

  if (preferredLocations.some((location) => !location)) {
    return { success: false, message: "Invalid preferred locations." };
  }

  if (
    !isOptionalNumber(value.minPrice) ||
    !isOptionalNumber(value.maxPrice) ||
    !isOptionalNumber(value.minBedrooms) ||
    !isOptionalNumber(value.minBathrooms) ||
    !isOptionalNumber(value.minAreaSqm)
  ) {
    return { success: false, message: "Invalid numeric fields in request." };
  }

  if (
    !isNonNegativeNumber(value.minPrice as number | undefined) ||
    !isNonNegativeNumber(value.maxPrice as number | undefined) ||
    !isNonNegativeNumber(value.minBedrooms as number | undefined) ||
    !isNonNegativeNumber(value.minBathrooms as number | undefined) ||
    !isNonNegativeNumber(value.minAreaSqm as number | undefined)
  ) {
    return { success: false, message: "Request numeric fields must be non-negative." };
  }

  if (
    value.minPrice !== undefined &&
    value.maxPrice !== undefined &&
    typeof value.minPrice === "number" &&
    typeof value.maxPrice === "number" &&
    value.minPrice > value.maxPrice
  ) {
    return { success: false, message: "Minimum price cannot exceed maximum price." };
  }

  if (value.mustHaveAmenities !== undefined && !isStringArray(value.mustHaveAmenities)) {
    return { success: false, message: "Amenities must be an array of strings." };
  }

  return {
    success: true,
    data: {
      customerId: value.customerId.trim() as string,
      requestType: value.requestType as CustomerRequest["requestType"],
      purpose: value.purpose as CustomerRequest["purpose"],
      preferredLocations: preferredLocations as CustomerRequest["preferredLocations"],
      minPrice: value.minPrice as number | undefined,
      maxPrice: value.maxPrice as number | undefined,
      minBedrooms: value.minBedrooms as number | undefined,
      minBathrooms: value.minBathrooms as number | undefined,
      minAreaSqm: value.minAreaSqm as number | undefined,
      mustHaveAmenities: (value.mustHaveAmenities as string[] | undefined)?.map((item) => item.trim()).filter(Boolean),
      notes: typeof value.notes === "string" ? value.notes.trim() : undefined
    }
  };
}
