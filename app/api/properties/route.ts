import { v4 as uuidv4 } from "uuid";
import { corsOptions, jsonResponse } from "@/lib/api-response";
import { getDataFilePath, readOwners, readProperties, updateCollection } from "@/lib/data";
import { readPropertyRequestPayload, savePropertyImages } from "@/lib/property-images";
import { filterAndSortProperties, propertyFiltersFromSearchParams } from "@/lib/property-query";
import { validatePropertyInput } from "@/lib/validation";
import type { Property } from "@/lib/types";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request) {
  try {
    const properties = await readProperties();
    const url = new URL(request.url);
    const filtered = filterAndSortProperties(properties, propertyFiltersFromSearchParams(url.searchParams));
    return jsonResponse(request, { properties: filtered });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to load properties.", details: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { payload, imageFiles, coverImageUploadIndex } = await readPropertyRequestPayload(request);
    const validation = validatePropertyInput(payload);
    if (!validation.success) return jsonResponse(request, { error: validation.message }, { status: 400 });

    let ownerFields: Pick<Property, "ownerId" | "ownerName" | "ownerPhone"> = {
      ownerId: undefined,
      ownerName: undefined,
      ownerPhone: undefined
    };

    if (validation.data.ownerId) {
      const owners = await readOwners();
      const owner = owners.find((entry) => entry.id === validation.data.ownerId);
      if (!owner) return jsonResponse(request, { error: "Owner not found." }, { status: 400 });
      ownerFields = { ownerId: owner.id, ownerName: owner.name, ownerPhone: owner.phone };
    }

    const uploadedImages = await savePropertyImages(validation.data.title, imageFiles, coverImageUploadIndex);
    const imagePaths = [...validation.data.images, ...uploadedImages.map((image) => image.imagePath)];
    const coverImage =
      (coverImageUploadIndex !== undefined ? uploadedImages[coverImageUploadIndex]?.imagePath : undefined) ||
      validation.data.coverImage ||
      imagePaths[0];
    const now = new Date().toISOString();
    const property: Property = {
      id: uuidv4(),
      ...validation.data,
      ...ownerFields,
      coverImage,
      images: imagePaths,
      createdAt: now,
      updatedAt: now
    };
    await updateCollection<Property>(getDataFilePath("properties.json"), (current) => [...current, property]);
    return jsonResponse(request, { property }, { status: 201 });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to create property.", details: String(error) }, { status: 500 });
  }
}
