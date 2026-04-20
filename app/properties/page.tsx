import { unstable_noStore as noStore } from "next/cache";
import { PropertiesListingPage } from "@/components/properties-listing-page";
import { readProperties } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function PropertiesPage() {
  noStore();
  const properties = await readProperties();
  return <PropertiesListingPage properties={properties} />;
}
