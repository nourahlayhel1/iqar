import { corsOptions, jsonResponse } from "@/lib/api-response";
import { getDataFilePath, readOwners, updateCollection } from "@/lib/data";
import { validateOwnerInput } from "@/lib/validation";
import type { Owner, Property } from "@/lib/types";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const owners = await readOwners();
    const owner = owners.find((entry) => entry.id === params.id);
    if (!owner) return jsonResponse(request, { error: "Owner not found." }, { status: 404 });
    return jsonResponse(request, { owner });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to load owner.", details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const owners = await readOwners();
    const owner = owners.find((entry) => entry.id === params.id);
    if (!owner) return jsonResponse(request, { error: "Owner not found." }, { status: 404 });

    const validation = validateOwnerInput(await request.json());
    if (!validation.success) return jsonResponse(request, { error: validation.message }, { status: 400 });

    const updated: Owner = { ...owner, ...validation.data, updatedAt: new Date().toISOString() };
    await updateCollection<Owner>(getDataFilePath("owners.json"), (current) =>
      current.map((entry) => (entry.id === params.id ? updated : entry))
    );
    await updateCollection<Property>(getDataFilePath("properties.json"), (current) =>
      current.map((entry) =>
        entry.ownerId === params.id
          ? { ...entry, ownerName: updated.name, ownerPhone: updated.phone, updatedAt: updated.updatedAt }
          : entry
      )
    );
    return jsonResponse(request, { owner: updated });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to update owner.", details: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const owners = await readOwners();
    const owner = owners.find((entry) => entry.id === params.id);
    if (!owner) return jsonResponse(request, { error: "Owner not found." }, { status: 404 });

    await updateCollection<Property>(getDataFilePath("properties.json"), (current) =>
      current.map((entry) =>
        entry.ownerId === params.id
          ? { ...entry, ownerId: undefined, ownerName: undefined, ownerPhone: undefined, updatedAt: new Date().toISOString() }
          : entry
      )
    );
    await updateCollection<Owner>(getDataFilePath("owners.json"), (current) => current.filter((entry) => entry.id !== params.id));
    return jsonResponse(request, { success: true });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to delete owner.", details: String(error) }, { status: 500 });
  }
}
