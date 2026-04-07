import { PropertyCatalog } from "@/components/property-catalog";
import { readProperties } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const properties = await readProperties();
  const countries = [...new Set(properties.map((property) => property.location.country).filter(Boolean))].sort();
  const cities = [...new Set(properties.map((property) => property.location.city).filter(Boolean))].sort();
  const areas = [...new Set(properties.map((property) => property.location.area).filter(Boolean))].sort();

  return <PropertyCatalog properties={properties} countries={countries} cities={cities} areas={areas} />;
}
