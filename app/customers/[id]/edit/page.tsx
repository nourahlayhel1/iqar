import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { readCustomers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({ params }: { params: { id: string } }) {
  const customers = await readCustomers();
  const customer = customers.find((entry) => entry.id === params.id);
  if (!customer) notFound();
  return <CustomerForm mode="edit" initialData={customer} customerId={customer.id} />;
}
