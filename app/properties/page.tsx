import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { PropertyFilterBar } from "@/components/property-filter-bar";
import { readProperties } from "@/lib/data";
import { filterAndSortProperties, propertyFiltersFromSearchParams } from "@/lib/property-query";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const properties = await readProperties();
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((entry) => params.append(key, entry));
    else if (value) params.set(key, value);
  });

  const filtered = filterAndSortProperties(properties, propertyFiltersFromSearchParams(params));

  return (
    <main className="grid">
      <section className="panel alt">
        <div className="toolbar">
          <div>
            <p className="eyebrow">Properties</p>
            <h1 className="section-title">Listings pipeline</h1>
            <p className="section-subtitle">Manage sale and rental inventory with full-field search.</p>
          </div>
          <Link href="/properties/new" className="btn">Add Property</Link>
        </div>
      </section>
      <PropertyFilterBar />
      <section>
        <div className="toolbar"><p className="muted">{filtered.length} properties found</p></div>
        {filtered.length ? <div className="grid properties">{filtered.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="empty-state">No properties matched the current search and filters.</div>}
      </section>
    </main>
  );
}
