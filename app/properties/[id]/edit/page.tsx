import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/property-form";
import { readProperties } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  const properties = await readProperties();
  const property = properties.find((entry) => entry.id === params.id);
  if (!property) notFound();
  return <PropertyForm mode="edit" initialData={property} propertyId={property.id} />;
}
