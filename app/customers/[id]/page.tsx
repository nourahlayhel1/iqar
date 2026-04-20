import Link from "next/link";
import { notFound } from "next/navigation";
import { readCustomers, readProperties, readRequests } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { findMatchesForRequest } from "@/lib/match";

export const dynamic = "force-dynamic";

export default async function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const [customers, requests, properties] = await Promise.all([readCustomers(), readRequests(), readProperties()]);
  const customer = customers.find((entry) => entry.id === params.id);
  if (!customer) notFound();
  const customerRequests = requests.filter((request) => request.customerId === customer.id);

  return (
    <main className="grid">
      <section className="panel alt">
        <div className="toolbar">
          <div>
            <p className="eyebrow">Customer profile</p>
            <h1 className="section-title">{customer.name}</h1>
            <p className="section-subtitle">{customer.phone}</p>
          </div>
        </div>
      </section>

      <section className="grid two">
        <div className="panel">
          <h2 className="section-title">Contact details</h2>
          <div className="detail-list">
            <div className="detail-item"><span className="label">Primary phone</span><strong>{customer.phone}</strong></div>
            <div className="detail-item"><span className="label">Alternative phone</span><strong>{customer.altPhone || "N/A"}</strong></div>
            <div className="detail-item"><span className="label">Created</span><strong>{formatDate(customer.createdAt)}</strong></div>
          </div>
          <div style={{ marginTop: "1rem" }}><span className="label">Notes</span><p>{customer.notes || "No notes added."}</p></div>
        </div>

        <div className="panel">
          <div className="toolbar">
            <div><h2 className="section-title">Requests</h2><p className="section-subtitle">{customerRequests.length} requests attached to this customer.</p></div>
            <Link href={`/requests/new?customerId=${customer.id}`} className="btn">Add Request</Link>
          </div>
          {customerRequests.length ? (
            <div className="grid">
              {customerRequests.map((request) => {
                const matches = findMatchesForRequest(properties, request);
                return (
                  <div key={request.id} className="card">
                    <div className="card-head">
                      <div><p className="eyebrow">{request.purpose} / {request.requestType}</p><h3 style={{ margin: "0.25rem 0" }}>{request.preferredLocations.map((location) => location.city).join(", ")}</h3></div>
                      <span className="badge">{matches.length} matches</span>
                    </div>
                    <p className="muted">{request.notes || "No notes"}</p>
                    {matches.length ? (
                      <div className="stats">
                        {matches.slice(0, 3).map((property) => (
                          <Link key={property.id} href={`/properties/${property.id}`} className="stat-pill">
                            {property.title}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    <div className="actions"><Link href={`/requests?customerId=${customer.id}`} className="btn-ghost">View matches</Link></div>
                  </div>
                );
              })}
            </div>
          ) : <div className="empty-state">No requests yet for this customer.</div>}
        </div>
      </section>
    </main>
  );
}
