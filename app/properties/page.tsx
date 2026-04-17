import { PropertiesListingPage } from "@/components/properties-listing-page";
import { readProperties } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const properties = await readProperties();
  return <PropertiesListingPage properties={properties} />;
}
