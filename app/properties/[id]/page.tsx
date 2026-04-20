import { notFound } from "next/navigation";
import { PROPERTY_SOURCE_LABELS } from "@/lib/constants";
import { readProperties } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const properties = await readProperties();
  const property = properties.find((entry) => entry.id === params.id);
  if (!property) notFound();
  const contactLabel = property.source === "broker" ? "Broker" : "Owner";
  const heroImage = property.coverImage || property.images[0] || "https://placehold.co/900x600?text=Property";
  const galleryImages = property.images.length ? property.images : ["https://placehold.co/900x600?text=Property"];

  return (
    <main className="grid">
      <section className="grid two">
        <div className="panel"><div className="image-frame"><img src={heroImage} alt={property.title} /></div></div>
        <div className="panel alt">
          <p className="eyebrow">{property.location.city}</p>
          <h1 className="section-title">{property.title}</h1>
          <p className="price">{formatCurrency(property.price, property.currency)}</p>
          <p className="section-subtitle">{property.description}</p>
          <div className="stats">
            <span className="stat-pill">{property.purpose}</span>
            <span className="stat-pill">{property.type}</span>
            {property.bedrooms !== undefined ? <span className="stat-pill">{property.bedrooms} bedrooms</span> : null}
            {property.bathrooms !== undefined ? <span className="stat-pill">{property.bathrooms} bathrooms</span> : null}
            {property.areaSqm !== undefined ? <span className="stat-pill">{property.areaSqm} sqm</span> : null}
          </div>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Property images</h2>
        <div className="property-gallery">
          {galleryImages.map((image, index) => (
            <div key={`${image}-${index}`} className="image-frame">
              <img src={image} alt={`${property.title} image ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Listing details</h2>
        <div className="detail-list">
          <div className="detail-item"><span className="label">Listed by</span><strong>{PROPERTY_SOURCE_LABELS[property.source ?? "direct_owner"]}</strong></div>
          <div className="detail-item"><span className="label">Floor</span><strong>{property.floor ?? "N/A"}</strong></div>
          <div className="detail-item"><span className="label">Parking</span><strong>{property.parking ? "Yes" : "No"}</strong></div>
          <div className="detail-item"><span className="label">Furnished</span><strong>{property.furnished ? "Yes" : "No"}</strong></div>
          <div className="detail-item"><span className="label">{contactLabel}</span><strong>{property.ownerName || "N/A"}</strong></div>
          <div className="detail-item"><span className="label">{contactLabel} phone</span><strong>{property.ownerPhone || "N/A"}</strong></div>
          <div className="detail-item"><span className="label">Created</span><strong>{formatDate(property.createdAt)}</strong></div>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Amenities</h2>
        <div className="stats">{property.amenities.length ? property.amenities.map((amenity) => <span key={amenity} className="stat-pill">{amenity}</span>) : <span className="muted">No amenities listed.</span>}</div>
      </section>
    </main>
  );
}
