import { v4 as uuidv4 } from "uuid";
import { corsOptions, jsonResponse } from "@/lib/api-response";
import { getDataFilePath, readOwners, updateCollection } from "@/lib/data";
import { matchesGlobalSearch } from "@/lib/search";
import { validateOwnerInput } from "@/lib/validation";
import type { Owner } from "@/lib/types";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request) {
  try {
    const owners = await readOwners();
    const q = new URL(request.url).searchParams.get("q") ?? undefined;
    return jsonResponse(request, { owners: owners.filter((owner) => matchesGlobalSearch(owner, q)) });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to load owners.", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const validation = validateOwnerInput(await request.json());
    if (!validation.success) return jsonResponse(request, { error: validation.message }, { status: 400 });

    const now = new Date().toISOString();
    const owner: Owner = { id: uuidv4(), ...validation.data, createdAt: now, updatedAt: now };
    await updateCollection<Owner>(getDataFilePath("owners.json"), (current) => [...current, owner]);
    return jsonResponse(request, { owner }, { status: 201 });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to create owner.", details: String(error) }, { status: 500 });
  }
}
