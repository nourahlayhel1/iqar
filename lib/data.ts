import { promises as fs } from "fs";
import path from "path";
import { seedCustomers, seedOwners, seedProperties, seedRequests } from "@/lib/seed";
import type { Customer, CustomerRequest, Owner, Property } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const locks = new Map<string, Promise<void>>();

const seedMap: Record<string, unknown[]> = {
  "properties.json": seedProperties,
  "customers.json": seedCustomers,
  "owners.json": seedOwners,
  "requests.json": seedRequests
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

export function getDataFilePath(fileName: "properties.json" | "customers.json" | "owners.json" | "requests.json"): string {
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

  await withLock(filePath, async () => {
    const tempPath = `${filePath}.tmp`;
    const payload = `${JSON.stringify(data, null, 2)}\n`;
    await fs.writeFile(tempPath, payload, "utf8");
    await fs.rename(tempPath, filePath);
  });
}

export async function updateCollection<T extends { id: string }>(
  filePath: string,
  updater: (current: T[]) => Promise<T[]> | T[]
): Promise<T[]> {
  return withLock(filePath, async () => {
    const current = await readJson<T[]>(filePath);
    const next = await updater(current);
    const tempPath = `${filePath}.tmp`;
    await fs.writeFile(tempPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    await fs.rename(tempPath, filePath);
    return next;
  });
}

export async function readProperties(): Promise<Property[]> {
  return readJson<Property[]>(getDataFilePath("properties.json"));
}

export async function readCustomers(): Promise<Customer[]> {
  return readJson<Customer[]>(getDataFilePath("customers.json"));
}

export async function readRequests(): Promise<CustomerRequest[]> {
  return readJson<CustomerRequest[]>(getDataFilePath("requests.json"));
}

export async function readOwners(): Promise<Owner[]> {
  return readJson<Owner[]>(getDataFilePath("owners.json"));
}
