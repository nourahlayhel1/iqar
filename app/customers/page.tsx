import Link from "next/link";
import { DeleteButton } from "@/components/delete-button";
import { readCustomers } from "@/lib/data";
import { matchesGlobalSearch } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const customers = await readCustomers();
  const query = searchParams.q ?? "";
  const filtered = customers.filter((customer) => matchesGlobalSearch({ name: customer.name, phone: customer.phone, altPhone: customer.altPhone }, query));

  return (
    <main className="grid">
      <section className="panel alt">
        <div className="toolbar">
          <div>
            <p className="eyebrow">Customers</p>
            <h1 className="section-title">Client records</h1>
            <p className="section-subtitle">Track buyers, tenants, and owners with contact notes.</p>
          </div>
          <Link href="/customers/new" className="btn">Add Customer</Link>
        </div>
      </section>
      <section className="panel">
        <form className="toolbar" action="/customers">
          <div style={{ flex: 1 }}>
            <label className="label">Search by name or phone</label>
            <input name="q" defaultValue={query} placeholder="Maya or +961..." />
          </div>
          <div className="actions"><button type="submit" className="btn">Search</button></div>
        </form>
      </section>
      <section className="panel">
        {filtered.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Name</th><th>Phone</th><th>Alternative</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.altPhone || "N/A"}</td>
                    <td><div className="actions"><Link href={`/customers/${customer.id}`} className="btn">View</Link><Link href={`/customers/${customer.id}/edit`} className="btn-secondary">Edit</Link><DeleteButton endpoint={`/api/customers/${customer.id}`} redirectTo="/customers" label="Delete" /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="empty-state">No customers matched the current search.</div>}
      </section>
    </main>
  );
}
