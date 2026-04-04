import { notFound } from "next/navigation";
import { RequestForm } from "@/components/request-form";
import { readCustomers, readRequests } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditRequestPage({ params }: { params: { id: string } }) {
  const [customers, requests] = await Promise.all([readCustomers(), readRequests()]);
  const request = requests.find((entry) => entry.id === params.id);
  if (!request) notFound();
  return <RequestForm mode="edit" customers={customers} initialData={request} requestId={request.id} />;
}
