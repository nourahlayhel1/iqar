import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { RequestMatchButton } from "@/components/request-match-button";
import { readCustomers, readProperties, readRequests } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { findMatchesForRequest } from "@/lib/match";

export const dynamic = "force-dynamic";

export default async function RequestsPage({ searchParams }: { searchParams: { customerId?: string } }) {
  const [customers, requests, properties] = await Promise.all([readCustomers(), readRequests(), readProperties()]);
  const filtered = searchParams.customerId ? requests.filter((request) => request.customerId === searchParams.customerId) : requests;

  return (
    <main className="grid">
      <section className="panel alt">
        <div className="toolbar">
          <div><p className="eyebrow">Requests</p><h1 className="section-title">Demand and matching</h1><p className="section-subtitle">Filter by customer and review matched properties per request.</p></div>
          <Link href="/requests/new" className="btn">Add Request</Link>
        </div>
      </section>
      <section className="panel">
        <form action="/requests" className="toolbar">
          <div style={{ minWidth: "240px" }}>
            <label className="label">Filter by customer</label>
            <select name="customerId" defaultValue={searchParams.customerId ?? ""}>
              <option value="">All customers</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </div>
          <div className="actions"><button className="btn" type="submit">Apply</button></div>
        </form>
      </section>
      {filtered.length ? (
        <div className="grid">
          {filtered.map((request) => {
            const customer = customers.find((entry) => entry.id === request.customerId);
            const matches = findMatchesForRequest(properties, request);
            return (
              <section key={request.id} className="panel">
                <div className="toolbar">
                  <div>
                    <p className="eyebrow">{request.purpose} / {request.requestType}</p>
                    <h2 className="section-title">{customer?.name ?? "Unknown customer"}</h2>
                    <p className="section-subtitle">{request.preferredLocations.map((location) => `${location.city}${location.area ? `, ${location.area}` : ""}`).join(" | ")}</p>
                  </div>
                  <div className="actions"><Link href={`/requests/${request.id}/edit`} className="btn-secondary">Edit</Link><DeleteButton endpoint={`/api/requests/${request.id}`} redirectTo="/requests" label="Delete" /></div>
                </div>
                <div className="stats">
                  {request.minPrice !== undefined ? <span className="stat-pill">Min {request.minPrice}</span> : null}
                  {request.maxPrice !== undefined ? <span className="stat-pill">Max {request.maxPrice}</span> : null}
                  {request.minBedrooms !== undefined ? <span className="stat-pill">{request.minBedrooms}+ bedrooms</span> : null}
                  {request.mustHaveAmenities?.map((amenity) => <span key={amenity} className="stat-pill">{amenity}</span>)}
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <p className="label">Matches</p>
                  <RequestMatchButton requestId={request.id} />
                  {matches.length ? <div className="grid properties">{matches.map((property) => <div key={property.id} className="card"><p className="eyebrow">{property.location.city}, {property.location.area}</p><h3 style={{ margin: "0.25rem 0" }}>{property.title}</h3><p className="price">{formatCurrency(property.price, property.currency)}</p><div className="actions"><Link href={`/properties/${property.id}`} className="btn">View</Link></div></div>)}</div> : <div className="empty-state">No current matches for this request.</div>}
                </div>
              </section>
            );
          })}
        </div>
      ) : <div className="empty-state">No requests found for the selected customer.</div>}
    </main>
  );
}
