import { corsOptions, jsonResponse } from "@/lib/api-response";
import { getDataFilePath, readCustomers, readRequests, updateCollection } from "@/lib/data";
import { validateRequestInput } from "@/lib/validation";
import type { CustomerRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const requests = await readRequests();
    const requestItem = requests.find((entry) => entry.id === params.id);
    if (!requestItem) return jsonResponse(request, { error: "Request not found." }, { status: 404 });
    return jsonResponse(request, { request: requestItem });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to load request.", details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const requests = await readRequests();
    const existing = requests.find((entry) => entry.id === params.id);
    if (!existing) return jsonResponse(request, { error: "Request not found." }, { status: 404 });

    const validation = validateRequestInput(await request.json());
    if (!validation.success) return jsonResponse(request, { error: validation.message }, { status: 400 });

    const customerExists = (await readCustomers()).some((customer) => customer.id === validation.data.customerId);
    if (!customerExists) return jsonResponse(request, { error: "Customer not found." }, { status: 404 });

    const updated: CustomerRequest = { ...existing, ...validation.data, updatedAt: new Date().toISOString() };
    await updateCollection<CustomerRequest>(getDataFilePath("requests.json"), (current) => current.map((entry) => (entry.id === params.id ? updated : entry)));
    return jsonResponse(request, { request: updated });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to update request.", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const requests = await readRequests();
    const requestItem = requests.find((entry) => entry.id === params.id);
    if (!requestItem) return jsonResponse(request, { error: "Request not found." }, { status: 404 });

    await updateCollection<CustomerRequest>(getDataFilePath("requests.json"), (current) => current.filter((entry) => entry.id !== params.id));
    return jsonResponse(request, { success: true });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to delete request.", details: String(error) }, { status: 500 });
  }
}
