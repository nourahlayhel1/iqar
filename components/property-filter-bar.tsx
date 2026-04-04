"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { COMMON_AMENITIES, PROPERTY_PURPOSES, PROPERTY_TYPES } from "@/lib/constants";

export function PropertyFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function toggleMultiValue(name: string, value: string, checked: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    const values = new Set(params.getAll(name));
    if (checked) values.add(value);
    else values.delete(value);
    params.delete(name);
    values.forEach((entry) => params.append(name, entry));
    router.push(`/properties?${params.toString()}`);
  }

  function updateField(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <section className="panel">
      <div className="toolbar">
        <div>
          <h2 className="section-title">Search and filters</h2>
          <p className="section-subtitle">Search every property field and refine the results.</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => router.push("/properties")}>Clear</button>
      </div>

      <div className="filters">
        <div><label className="label">Global search</label><input defaultValue={searchParams.get("q") ?? ""} onBlur={(e) => updateField("q", e.target.value)} /></div>
        <div><label className="label">Country</label><input defaultValue={searchParams.get("country") ?? ""} onBlur={(e) => updateField("country", e.target.value)} /></div>
        <div><label className="label">City</label><input defaultValue={searchParams.get("city") ?? ""} onBlur={(e) => updateField("city", e.target.value)} /></div>
        <div><label className="label">Area</label><input defaultValue={searchParams.get("area") ?? ""} onBlur={(e) => updateField("area", e.target.value)} /></div>
        <div>
          <label className="label">Purpose</label>
          <select defaultValue={searchParams.get("purpose") ?? ""} onChange={(e) => updateField("purpose", e.target.value)}>
            <option value="">Any</option>
            {PROPERTY_PURPOSES.map((purpose) => <option key={purpose} value={purpose}>{purpose}</option>)}
          </select>
        </div>
        <div><label className="label">Min price</label><input type="number" min="0" defaultValue={searchParams.get("minPrice") ?? ""} onBlur={(e) => updateField("minPrice", e.target.value)} /></div>
        <div><label className="label">Max price</label><input type="number" min="0" defaultValue={searchParams.get("maxPrice") ?? ""} onBlur={(e) => updateField("maxPrice", e.target.value)} /></div>
        <div><label className="label">Min bedrooms</label><input type="number" min="0" defaultValue={searchParams.get("minBedrooms") ?? ""} onBlur={(e) => updateField("minBedrooms", e.target.value)} /></div>
        <div>
          <label className="label">Sort</label>
          <select defaultValue={searchParams.get("sort") ?? "newest"} onChange={(e) => updateField("sort", e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="priceAsc">Price Low - High</option>
            <option value="priceDesc">Price High - Low</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label className="label">Property types</label>
        <div className="checkbox-grid">
          {PROPERTY_TYPES.map((type) => (
            <label key={type} className="checkbox-item">
              <input type="checkbox" checked={searchParams.getAll("types").includes(type)} onChange={(e) => toggleMultiValue("types", type, e.target.checked)} />
              <span>{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <label className="label">Amenities (match all selected)</label>
        <div className="checkbox-grid">
          {COMMON_AMENITIES.map((amenity) => (
            <label key={amenity} className="checkbox-item">
              <input type="checkbox" checked={searchParams.getAll("amenities").includes(amenity)} onChange={(e) => toggleMultiValue("amenities", amenity, e.target.checked)} />
              <span>{amenity}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}
