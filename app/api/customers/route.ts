import { v4 as uuidv4 } from "uuid";
import { corsOptions, jsonResponse } from "@/lib/api-response";
import { getDataFilePath, readCustomers, updateCollection } from "@/lib/data";
import { matchesGlobalSearch } from "@/lib/search";
import { validateCustomerInput } from "@/lib/validation";
import type { Customer } from "@/lib/types";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request) {
  try {
    const customers = await readCustomers();
    const q = new URL(request.url).searchParams.get("q") ?? undefined;
    return jsonResponse(request, { customers: customers.filter((customer) => matchesGlobalSearch(customer, q)) });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to load customers.", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const validation = validateCustomerInput(await request.json());
    if (!validation.success) return jsonResponse(request, { error: validation.message }, { status: 400 });

    const now = new Date().toISOString();
    const customer: Customer = { id: uuidv4(), ...validation.data, createdAt: now, updatedAt: now };
    await updateCollection<Customer>(getDataFilePath("customers.json"), (current) => [...current, customer]);
    return jsonResponse(request, { customer }, { status: 201 });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to create customer.", details: String(error) }, { status: 500 });
  }
}
