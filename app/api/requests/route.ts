import { v4 as uuidv4 } from "uuid";
import { corsOptions, jsonResponse } from "@/lib/api-response";
import { getDataFilePath, readCustomers, readRequests, updateCollection } from "@/lib/data";
import { validateRequestInput } from "@/lib/validation";
import type { CustomerRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request) {
  try {
    const customerId = new URL(request.url).searchParams.get("customerId");
    const requests = await readRequests();
    return jsonResponse(request, { requests: customerId ? requests.filter((entry) => entry.customerId === customerId) : requests });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to load requests.", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const validation = validateRequestInput(await request.json());
    if (!validation.success) return jsonResponse(request, { error: validation.message }, { status: 400 });

    const customerExists = (await readCustomers()).some((customer) => customer.id === validation.data.customerId);
    if (!customerExists) return jsonResponse(request, { error: "Customer not found." }, { status: 404 });

    const now = new Date().toISOString();
    const requestItem: CustomerRequest = { id: uuidv4(), ...validation.data, createdAt: now, updatedAt: now };
    await updateCollection<CustomerRequest>(getDataFilePath("requests.json"), (current) => [...current, requestItem]);
    return jsonResponse(request, { request: requestItem }, { status: 201 });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to create request.", details: String(error) }, { status: 500 });
  }
}
