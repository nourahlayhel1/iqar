import { PropertyCatalog } from "@/components/property-catalog";
import { readProperties } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const properties = await readProperties();
  const countries = [...new Set(properties.flatMap((property) => property.location.country ? [property.location.country] : []))].sort();
  const cities = [...new Set(properties.map((property) => property.location.city).filter(Boolean))].sort();
  const areas = [...new Set(properties.flatMap((property) => property.location.area ? [property.location.area] : []))].sort();

  return <PropertyCatalog properties={properties} countries={countries} cities={cities} areas={areas} />;
}
