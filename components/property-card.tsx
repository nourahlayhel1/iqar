import { PROPERTY_SOURCE_LABELS } from "@/lib/constants";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";
import type { Property } from "@/lib/types";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <article className="card">
      <div className="image-frame">
        <img src={property.coverImage || property.images[0] || "https://placehold.co/800x500?text=Property"} alt={property.title} />
      </div>
      <div style={{ marginTop: "1rem" }}>
        <div className="card-head">
          <div>
            <p className="eyebrow">{property.location.city}</p>
            <h3 style={{ margin: "0.25rem 0 0.2rem" }}>{property.title}</h3>
          </div>
          <span className="badge">{property.purpose} / {property.type}</span>
        </div>
        <div className="price">{formatCurrency(property.price, property.currency)}</div>
        <div className="stats">
          <span className="stat-pill">{PROPERTY_SOURCE_LABELS[property.source ?? "direct_owner"]}</span>
          {property.bedrooms !== undefined ? <span className="stat-pill">{property.bedrooms} bed</span> : null}
          {property.bathrooms !== undefined ? <span className="stat-pill">{property.bathrooms} bath</span> : null}
          {property.areaSqm !== undefined ? <span className="stat-pill">{property.areaSqm} sqm</span> : null}
        </div>
        <div className="actions">
          <Link href={`/properties/${property.id}`} className="btn">View</Link>
        </div>
      </div>
    </article>
  );
}
