import Link from "next/link";
import { readCustomers, readProperties, readRequests } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [properties, customers, requests] = await Promise.all([readProperties(), readCustomers(), readRequests()]);

  return (
    <main className="grid" style={{ gap: "1.25rem" }}>
      <section className="hero">
        <div className="panel alt">
          <p className="eyebrow">Office overview</p>
          <h1 className="section-title">Run daily brokerage work without a database.</h1>
          <p className="section-subtitle">
            This MVP keeps listings, customers, and request matching in JSON files through Next.js route handlers.
          </p>
          <div className="actions">
            <Link href="/properties" className="btn">Browse Properties</Link>
            <Link href="/customers" className="btn-secondary">Manage Customers</Link>
            <Link href="/requests" className="btn-ghost">Review Requests</Link>
          </div>
        </div>
        <div className="panel">
          <p className="eyebrow">Snapshot</p>
          <div className="detail-list">
            <div className="detail-item"><span className="label">Properties</span><strong>{properties.length}</strong></div>
            <div className="detail-item"><span className="label">Customers</span><strong>{customers.length}</strong></div>
            <div className="detail-item"><span className="label">Active requests</span><strong>{requests.length}</strong></div>
          </div>
        </div>
      </section>
    </main>
  );
}
