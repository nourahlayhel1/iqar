import { promises as fs } from "fs";
import path from "path";
import { seedCustomers, seedOwners, seedProperties, seedRequests } from "@/lib/seed";
import type { Customer, CustomerRequest, Owner, Property } from "@/lib/types";
import { getSupabaseDatabaseClient } from "@/utils/supabase/database";

type DataFileName = "properties.json" | "customers.json" | "owners.json" | "requests.json";
type TableName = "properties" | "customers" | "owners" | "requests";

interface CustomerRow {
  id: string;
  name: string;
  phone: string;
  alt_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface OwnerRow {
  id: string;
  name: string;
  phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  owner_documents?: Array<{ name: string; url: string }>;
}

interface PropertyRow {
  id: string;
  title: string;
  description: string | null;
  type: Property["type"];
  purpose: Property["purpose"];
  price: number | string;
  currency: Property["currency"];
  source: Property["source"];
  country: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | string | null;
  floor: number | null;
  parking: boolean | null;
  furnished: boolean | null;
  owner_id: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  property_amenities?: Array<{ amenity: string }>;
  property_images?: Array<{ image_url: string; sort_order: number }>;
}

interface RequestRow {
  id: string;
  customer_id: string;
  request_type: CustomerRequest["requestType"];
  purpose: CustomerRequest["purpose"];
  min_price: number | string | null;
  max_price: number | string | null;
  min_bedrooms: number | null;
  min_bathrooms: number | null;
  min_area_sqm: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  request_preferred_locations?: Array<{ city: string | null; area: string | null }>;
  request_must_have_amenities?: Array<{ amenity: string }>;
}

const dataDir = path.join(process.cwd(), "data");
const locks = new Map<string, Promise<void>>();
let seedSyncPromise: Promise<void> | null = null;

const seedMap: Record<DataFileName, Array<Customer | CustomerRequest | Owner | Property>> = {
  "properties.json": seedProperties,
  "customers.json": seedCustomers,
  "owners.json": seedOwners,
  "requests.json": seedRequests
};

const tableMap: Record<DataFileName, TableName> = {
  "properties.json": "properties",
  "customers.json": "customers",
  "owners.json": "owners",
  "requests.json": "requests"
};

async function withLock<T>(filePath: string, task: () => Promise<T>): Promise<T> {
  const previous = locks.get(filePath) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  locks.set(filePath, previous.then(() => current));

  await previous;
  try {
    return await task();
  } finally {
    release();
    if (locks.get(filePath) === current) {
      locks.delete(filePath);
    }
  }
}

export function getDataFilePath(fileName: DataFileName): string {
  return path.join(dataDir, fileName);
}

export async function ensureDataFilesExistWithSeed(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });

  await Promise.all(
    Object.entries(seedMap).map(async ([fileName, seedData]) => {
      const filePath = path.join(dataDir, fileName);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, `${JSON.stringify(seedData, null, 2)}\n`, "utf8");
      }
    })
  );
}

export async function readJson<T>(filePath: string): Promise<T> {
  await ensureDataFilesExistWithSeed();
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

export async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await ensureDataFilesExistWithSeed();
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
}

export async function updateCollection<T extends { id: string }>(
  filePath: string,
  updater: (current: T[]) => Promise<T[]> | T[]
): Promise<T[]> {
  return withLock(filePath, async () => {
    const current = await readSupabaseCollection<T>(filePath);
    const next = await updater(current);
    await writeSupabaseCollection(filePath, current, next);
    return next;
  });
}

export async function readProperties(): Promise<Property[]> {
  return readSupabaseCollection<Property>(getDataFilePath("properties.json"));
}

export async function readCustomers(): Promise<Customer[]> {
  return readSupabaseCollection<Customer>(getDataFilePath("customers.json"));
}

export async function readRequests(): Promise<CustomerRequest[]> {
  return readSupabaseCollection<CustomerRequest>(getDataFilePath("requests.json"));
}

export async function readOwners(): Promise<Owner[]> {
  return readSupabaseCollection<Owner>(getDataFilePath("owners.json"));
}

function getTableNameFromFilePath(filePath: string): TableName {
  const fileName = path.basename(filePath) as DataFileName;
  const tableName = tableMap[fileName];

  if (!tableName) {
    throw new Error(`Unsupported data file: ${fileName}`);
  }

  return tableName;
}

async function readSupabaseCollection<T extends { id: string }>(filePath: string): Promise<T[]> {
  const tableName = getTableNameFromFilePath(filePath);
  let current = await fetchTableData(tableName);
  if (current.length) {
    return current as unknown as T[];
  }

  await syncSeedDataToSupabase();
  current = await fetchTableData(tableName);
  return current as unknown as T[];
}

async function syncSeedDataToSupabase(): Promise<void> {
  seedSyncPromise ??= (async () => {
    const importPlan: DataFileName[] = ["customers.json", "owners.json", "properties.json", "requests.json"];

    for (const fileName of importPlan) {
      const filePath = getDataFilePath(fileName);
      const tableName = getTableNameFromFilePath(filePath);
      const current = await fetchTableData(tableName);
      if (current.length) continue;

      const localSeed = await readJson<Array<Customer | CustomerRequest | Owner | Property>>(filePath);
      if (!localSeed.length) continue;

      await writeSupabaseCollection(filePath, [], localSeed);
    }
  })();

  try {
    await seedSyncPromise;
  } finally {
    seedSyncPromise = null;
  }
}

async function writeSupabaseCollection<T extends { id: string }>(
  filePath: string,
  current: T[],
  next: T[]
): Promise<void> {
  const tableName = getTableNameFromFilePath(filePath);
  const currentIds = new Set(current.map((entry) => entry.id));
  const nextIds = new Set(next.map((entry) => entry.id));
  const removedIds = [...currentIds].filter((id) => !nextIds.has(id));

  await deleteRows(tableName, removedIds);

  if (tableName === "customers") {
    await upsertCustomers(next as unknown as Customer[]);
    return;
  }

  if (tableName === "owners") {
    await upsertOwners(next as unknown as Owner[]);
    return;
  }

  if (tableName === "properties") {
    await upsertProperties(next as unknown as Property[]);
    return;
  }

  await upsertRequests(next as unknown as CustomerRequest[]);
}

async function fetchTableData(tableName: TableName): Promise<Array<Customer | CustomerRequest | Owner | Property>> {
  if (tableName === "customers") {
    return fetchCustomers();
  }

  if (tableName === "owners") {
    return fetchOwners();
  }

  if (tableName === "properties") {
    return fetchProperties();
  }

  return fetchRequests();
}

async function fetchCustomers(): Promise<Customer[]> {
  const supabase = getSupabaseDatabaseClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, alt_phone, notes, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as CustomerRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    altPhone: row.alt_phone ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function fetchOwners(): Promise<Owner[]> {
  const supabase = getSupabaseDatabaseClient();
  const { data, error } = await supabase
    .from("owners")
    .select("id, name, phone, notes, created_at, updated_at, owner_documents(name, url)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as OwnerRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    notes: row.notes ?? undefined,
    documents: (row.owner_documents ?? []).map((document) => ({
      name: document.name,
      url: document.url
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function fetchProperties(): Promise<Property[]> {
  const supabase = getSupabaseDatabaseClient();
  const { data, error } = await supabase
    .from("properties")
    .select(
      "id, title, description, type, purpose, price, currency, source, country, city, area, address, bedrooms, bathrooms, area_sqm, floor, parking, furnished, owner_id, owner_name, owner_phone, cover_image, created_at, updated_at, property_amenities(amenity), property_images(image_url, sort_order)"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as PropertyRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    type: row.type,
    purpose: row.purpose,
    price: Number(row.price),
    currency: row.currency,
    source: row.source ?? "direct_owner",
    location: {
      country: row.country ?? "",
      city: row.city ?? "",
      area: row.area ?? "",
      address: row.address ?? undefined
    },
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    areaSqm: row.area_sqm === null ? undefined : Number(row.area_sqm),
    floor: row.floor ?? undefined,
    parking: row.parking ?? undefined,
    furnished: row.furnished ?? undefined,
    amenities: (row.property_amenities ?? []).map((item) => item.amenity),
    coverImage: row.cover_image ?? undefined,
    images: (row.property_images ?? [])
      .slice()
      .sort((left, right) => left.sort_order - right.sort_order)
      .map((item) => item.image_url),
    ownerId: row.owner_id ?? undefined,
    ownerName: row.owner_name ?? undefined,
    ownerPhone: row.owner_phone ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function fetchRequests(): Promise<CustomerRequest[]> {
  const supabase = getSupabaseDatabaseClient();
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, customer_id, request_type, purpose, min_price, max_price, min_bedrooms, min_bathrooms, min_area_sqm, notes, created_at, updated_at, request_preferred_locations(city, area), request_must_have_amenities(amenity)"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return ((data ?? []) as RequestRow[]).map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    requestType: row.request_type,
    purpose: row.purpose,
    preferredLocations: (row.request_preferred_locations ?? []).map((location) => ({
      city: location.city ?? "",
      area: location.area ?? undefined
    })),
    minPrice: row.min_price === null ? undefined : Number(row.min_price),
    maxPrice: row.max_price === null ? undefined : Number(row.max_price),
    minBedrooms: row.min_bedrooms ?? undefined,
    minBathrooms: row.min_bathrooms ?? undefined,
    minAreaSqm: row.min_area_sqm === null ? undefined : Number(row.min_area_sqm),
    mustHaveAmenities: (row.request_must_have_amenities ?? []).map((item) => item.amenity),
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

async function upsertCustomers(customers: Customer[]): Promise<void> {
  if (!customers.length) return;

  const supabase = getSupabaseDatabaseClient();
  const rows = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    alt_phone: customer.altPhone ?? null,
    notes: customer.notes ?? null,
    created_at: customer.createdAt,
    updated_at: customer.updatedAt
  }));

  const { error } = await supabase.from("customers").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);
}

async function upsertOwners(owners: Owner[]): Promise<void> {
  if (!owners.length) return;

  const supabase = getSupabaseDatabaseClient();
  const rows = owners.map((owner) => ({
    id: owner.id,
    name: owner.name,
    phone: owner.phone,
    notes: owner.notes ?? null,
    created_at: owner.createdAt,
    updated_at: owner.updatedAt
  }));

  const { error } = await supabase.from("owners").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);

  const ownerIds = owners.map((owner) => owner.id);
  await supabase.from("owner_documents").delete().in("owner_id", ownerIds);

  const documents = owners.flatMap((owner) =>
    owner.documents.map((document) => ({
      owner_id: owner.id,
      name: document.name,
      url: document.url
    }))
  );

  if (documents.length) {
    const { error: documentError } = await supabase.from("owner_documents").insert(documents);
    if (documentError) throw new Error(documentError.message);
  }
}

async function upsertProperties(properties: Property[]): Promise<void> {
  if (!properties.length) return;

  const supabase = getSupabaseDatabaseClient();
  const rows = properties.map((property) => ({
    id: property.id,
    title: property.title,
    description: property.description,
    type: property.type,
    purpose: property.purpose,
    price: property.price,
    currency: property.currency,
    source: property.source ?? "direct_owner",
    country: property.location.country,
    city: property.location.city,
    area: property.location.area,
    address: property.location.address ?? null,
    bedrooms: property.bedrooms ?? null,
    bathrooms: property.bathrooms ?? null,
    area_sqm: property.areaSqm ?? null,
    floor: property.floor ?? null,
    parking: property.parking ?? null,
    furnished: property.furnished ?? null,
    owner_id: property.ownerId ?? null,
    owner_name: property.ownerName ?? null,
    owner_phone: property.ownerPhone ?? null,
    cover_image: property.coverImage ?? property.images[0] ?? null,
    created_at: property.createdAt,
    updated_at: property.updatedAt
  }));

  const { error } = await supabase.from("properties").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);

  const propertyIds = properties.map((property) => property.id);
  await Promise.all([
    supabase.from("property_amenities").delete().in("property_id", propertyIds),
    supabase.from("property_images").delete().in("property_id", propertyIds)
  ]);

  const amenities = properties.flatMap((property) =>
    property.amenities.map((amenity) => ({
      property_id: property.id,
      amenity
    }))
  );
  const images = properties.flatMap((property) =>
    property.images.map((imageUrl, index) => ({
      property_id: property.id,
      image_url: imageUrl,
      sort_order: index
    }))
  );

  if (amenities.length) {
    const { error: amenitiesError } = await supabase.from("property_amenities").insert(amenities);
    if (amenitiesError) throw new Error(amenitiesError.message);
  }

  if (images.length) {
    const { error: imagesError } = await supabase.from("property_images").insert(images);
    if (imagesError) throw new Error(imagesError.message);
  }
}

async function upsertRequests(requests: CustomerRequest[]): Promise<void> {
  if (!requests.length) return;

  const supabase = getSupabaseDatabaseClient();
  const rows = requests.map((request) => ({
    id: request.id,
    customer_id: request.customerId,
    request_type: request.requestType,
    purpose: request.purpose,
    min_price: request.minPrice ?? null,
    max_price: request.maxPrice ?? null,
    min_bedrooms: request.minBedrooms ?? null,
    min_bathrooms: request.minBathrooms ?? null,
    min_area_sqm: request.minAreaSqm ?? null,
    notes: request.notes ?? null,
    created_at: request.createdAt,
    updated_at: request.updatedAt
  }));

  const { error } = await supabase.from("requests").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(error.message);

  const requestIds = requests.map((request) => request.id);
  await Promise.all([
    supabase.from("request_preferred_locations").delete().in("request_id", requestIds),
    supabase.from("request_must_have_amenities").delete().in("request_id", requestIds)
  ]);

  const locations = requests.flatMap((request) =>
    request.preferredLocations.map((location) => ({
      request_id: request.id,
      city: location.city,
      area: location.area ?? null
    }))
  );
  const amenities = requests.flatMap((request) =>
    (request.mustHaveAmenities ?? []).map((amenity) => ({
      request_id: request.id,
      amenity
    }))
  );

  if (locations.length) {
    const { error: locationsError } = await supabase.from("request_preferred_locations").insert(locations);
    if (locationsError) throw new Error(locationsError.message);
  }

  if (amenities.length) {
    const { error: amenitiesError } = await supabase.from("request_must_have_amenities").insert(amenities);
    if (amenitiesError) throw new Error(amenitiesError.message);
  }
}

async function deleteRows(tableName: TableName, removedIds: string[]): Promise<void> {
  if (!removedIds.length) return;

  const supabase = getSupabaseDatabaseClient();
  const { error } = await supabase.from(tableName).delete().in("id", removedIds);
  if (error) throw new Error(error.message);
}
