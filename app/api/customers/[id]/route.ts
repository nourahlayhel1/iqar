import { corsOptions, jsonResponse } from "@/lib/api-response";
import { getDataFilePath, readCustomers, updateCollection } from "@/lib/data";
import { validateCustomerInput } from "@/lib/validation";
import type { Customer, CustomerRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const customers = await readCustomers();
    const customer = customers.find((entry) => entry.id === params.id);
    if (!customer) return jsonResponse(request, { error: "Customer not found." }, { status: 404 });
    return jsonResponse(request, { customer });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to load customer.", details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const customers = await readCustomers();
    const customer = customers.find((entry) => entry.id === params.id);
    if (!customer) return jsonResponse(request, { error: "Customer not found." }, { status: 404 });

    const validation = validateCustomerInput(await request.json());
    if (!validation.success) return jsonResponse(request, { error: validation.message }, { status: 400 });

    const updated: Customer = { ...customer, ...validation.data, updatedAt: new Date().toISOString() };
    await updateCollection<Customer>(getDataFilePath("customers.json"), (current) => current.map((entry) => (entry.id === params.id ? updated : entry)));
    return jsonResponse(request, { customer: updated });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to update customer.", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const customers = await readCustomers();
    const customer = customers.find((entry) => entry.id === params.id);
    if (!customer) return jsonResponse(request, { error: "Customer not found." }, { status: 404 });

    await updateCollection<Customer>(getDataFilePath("customers.json"), (current) => current.filter((entry) => entry.id !== params.id));
    await updateCollection<CustomerRequest>(getDataFilePath("requests.json"), (current) => current.filter((entry) => entry.customerId !== params.id));
    return jsonResponse(request, { success: true });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to delete customer.", details: String(error) }, { status: 500 });
  }
}
