import { RequestForm } from "@/components/request-form";
import { readCustomers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewRequestPage({ searchParams }: { searchParams: { customerId?: string } }) {
  const customers = await readCustomers();
  return <RequestForm mode="create" customers={customers} presetCustomerId={searchParams.customerId} />;
}
