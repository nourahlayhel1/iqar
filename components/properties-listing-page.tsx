"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CustomSelect } from "@/components/custom-select";
import { PropertyShareButton } from "@/components/property-share-button";
import { formatCurrency } from "@/lib/format";
import type { Property } from "@/lib/types";

type SortValue = "featured" | "newest" | "priceAsc" | "priceDesc";

interface ListingFilters {
  purpose: "sale" | "rent";
  types: string[];
  maxPrice?: number;
  bedrooms?: number;
  amenities: string[];
  sort: SortValue;
}

const typeOptions = ["apartment", "villa", "penthouse", "townhouse"];
const bedroomOptions = [0, 1, 2, 3, 4];
const amenityOptions = ["pool", "sea_view", "security", "furnished", "garden"];

const initialFilters: ListingFilters = {
  purpose: "sale",
  types: [],
  maxPrice: undefined,
  bedrooms: undefined,
  amenities: [],
  sort: "featured"
};

function labelForValue(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function matchesPropertyType(property: Property, selectedTypes: string[]): boolean {
  if (!selectedTypes.length) return true;

  const title = property.title.toLowerCase();
  return selectedTypes.some((type) => property.type === type || title.includes(type));
}

function sortProperties(properties: Property[], sort: SortValue): Property[] {
  return [...properties].sort((left, right) => {
    switch (sort) {
      case "priceAsc":
        return left.price - right.price;
      case "priceDesc":
        return right.price - left.price;
      case "newest":
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      case "featured":
      default:
        return Number(Boolean(right.coverImage || right.images[0])) - Number(Boolean(left.coverImage || left.images[0])) ||
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
  });
}

function filterProperties(properties: Property[], filters: ListingFilters): Property[] {
  const filtered = properties.filter((property) => {
    if (property.purpose !== filters.purpose) return false;
    if (!matchesPropertyType(property, filters.types)) return false;
    if (filters.maxPrice !== undefined && property.price > filters.maxPrice) return false;
    if (filters.bedrooms !== undefined && filters.bedrooms > 0 && (property.bedrooms ?? 0) < filters.bedrooms) return false;

    if (filters.amenities.length) {
      const propertyAmenities = new Set(property.amenities.map((amenity) => amenity.toLowerCase()));
      if (!filters.amenities.every((amenity) => propertyAmenities.has(amenity.toLowerCase()))) return false;
    }

    return true;
  });

  return sortProperties(filtered, filters.sort);
}

export function PropertiesListingPage({ properties }: { properties: Property[] }) {
  const [filters, setFilters] = useState<ListingFilters>(initialFilters);

  const filteredProperties = useMemo(() => filterProperties(properties, filters), [properties, filters]);

  function toggleArrayFilter(key: "types" | "amenities", value: string) {
    setFilters((current) => {
      const currentValues = current[key];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((entry) => entry !== value)
        : [...currentValues, value];

      return { ...current, [key]: nextValues };
    });
  }

  function updateSort(sort: SortValue) {
    setFilters((current) => ({ ...current, sort }));
  }

  return (
    <main className="properties-showcase">
      <section className="properties-shell">
        <div className="properties-heading-row">
          <div>
            <h1>Exclusive Properties</h1>
            <p>Showing {filteredProperties.length} premium listings</p>
          </div>

          <div className="properties-sort">
            <CustomSelect
              value={filters.sort}
              ariaLabel="Sort properties"
              options={[
                { value: "featured", label: "Sort by: Featured" },
                { value: "newest", label: "Sort by: Newest" },
                { value: "priceDesc", label: "Sort by: Price high" },
                { value: "priceAsc", label: "Sort by: Price low" }
              ]}
              onChange={(value) => updateSort(value as SortValue)}
            />
          </div>
        </div>

        <div className="properties-divider" />

        <div className="properties-content-grid">
          <aside className="refine-panel">
            <div className="refine-title">
              <span aria-hidden="true">≡</span>
              <h2>Refine Search</h2>
            </div>

            <div className="filter-block">
              <p>Status</p>
              <div className="purpose-toggle">
                <button
                  type="button"
                  className={filters.purpose === "sale" ? "active" : ""}
                  onClick={() => setFilters((current) => ({ ...current, purpose: "sale" }))}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className={filters.purpose === "rent" ? "active" : ""}
                  onClick={() => setFilters((current) => ({ ...current, purpose: "rent" }))}
                >
                  Rent
                </button>
              </div>
            </div>

            <div className="filter-block">
              <p>Property Type</p>
              <div className="refine-check-list">
                {typeOptions.map((type) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={filters.types.includes(type)}
                      onChange={() => toggleArrayFilter("types", type)}
                    />
                    <span>{labelForValue(type)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <div className="range-label">
                <p>Max Price</p>
                <strong>{filters.maxPrice ? `$${(filters.maxPrice / 1000000).toFixed(1)}M` : "Any"}</strong>
              </div>
              <input
                className="price-range"
                type="range"
                min="1000000"
                max="30000000"
                step="500000"
                value={filters.maxPrice ?? 30000000}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))
                }
              />
            </div>

            <div className="filter-block">
              <p>Bedrooms</p>
              <div className="bedroom-grid">
                {bedroomOptions.map((bedroom) => (
                  <button
                    key={bedroom}
                    type="button"
                    className={(filters.bedrooms ?? 0) === bedroom ? "active" : ""}
                    onClick={() => setFilters((current) => ({ ...current, bedrooms: bedroom }))}
                  >
                    {bedroom === 0 ? "Any" : bedroom === 4 ? "4+" : bedroom}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-block">
              <p>Amenities</p>
              <div className="refine-check-list">
                {amenityOptions.map((amenity) => (
                  <label key={amenity}>
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity)}
                      onChange={() => toggleArrayFilter("amenities", amenity)}
                    />
                    <span>{labelForValue(amenity)}</span>
                  </label>
                ))}
              </div>
            </div>

          </aside>

          <section className="exclusive-property-grid" aria-label="Exclusive property listings">
            {filteredProperties.length ? (
              filteredProperties.map((property) => {
                const image = property.coverImage || property.images[0];

                return (
                  <article key={property.id} className="exclusive-card">
                    <PropertyShareButton title={property.title} url={`/properties/${property.id}`} iconOnly />
                    <Link href={`/properties/${property.id}`} className="property-card-link">
                      <div className="exclusive-media">
                        {image ? <img src={image} alt={property.title} /> : <div className="image-fallback">Property Preview</div>}
                        <div className="media-badges">
                          <span className="badge">For {property.purpose === "sale" ? "Sale" : "Rent"}</span>
                          {property.purpose === "sale" ? <span className="badge muted-badge">Featured</span> : null}
                        </div>
                      </div>
                      <div className="exclusive-body">
                        <div className="price">{formatCurrency(property.price, property.currency)}{property.purpose === "rent" ? " /mo" : ""}</div>
                        <h3>{property.title}</h3>
                        <p className="listing-location">{property.location.city}</p>
                        <div className="stats">
                          <span className="stat-pill stat-bed">{property.bedrooms ?? 0}</span>
                          <span className="stat-pill stat-bath">{property.bathrooms ?? 0}</span>
                          <span className="stat-pill stat-area">{property.areaSqm ? `${property.areaSqm} sqm` : "0 sqm"}</span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })
            ) : (
              <div className="empty-state">No properties matched the selected filters.</div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
