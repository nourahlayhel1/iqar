import { corsOptions, jsonResponse } from "@/lib/api-response";
import { getDataFilePath, readOwners, readProperties, updateCollection } from "@/lib/data";
import { readPropertyRequestPayload, savePropertyImages } from "@/lib/property-images";
import { validatePropertyInput } from "@/lib/validation";
import type { Property } from "@/lib/types";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const properties = await readProperties();
    const property = properties.find((entry) => entry.id === params.id);
    if (!property) return jsonResponse(request, { error: "Property not found." }, { status: 404 });
    return jsonResponse(request, { property });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to load property.", details: String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await readProperties();
    const property = existing.find((entry) => entry.id === params.id);
    if (!property) return jsonResponse(request, { error: "Property not found." }, { status: 404 });

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

    const nextPhotoNumber = imagePathsNextPhotoNumber(validation.data.images, validation.data.coverImage);
    const uploadedImages = await savePropertyImages(
      validation.data.title,
      imageFiles,
      coverImageUploadIndex,
      nextPhotoNumber
    );
    const imagePaths = [...validation.data.images, ...uploadedImages.map((image) => image.imagePath)];
    const coverImage =
      (coverImageUploadIndex !== undefined ? uploadedImages[coverImageUploadIndex]?.imagePath : undefined) ||
      (validation.data.coverImage && imagePaths.includes(validation.data.coverImage) ? validation.data.coverImage : undefined) ||
      imagePaths[0];
    const updated: Property = {
      ...property,
      ...validation.data,
      ...ownerFields,
      coverImage,
      images: imagePaths,
      updatedAt: new Date().toISOString()
    };
    await updateCollection<Property>(getDataFilePath("properties.json"), (current) => current.map((entry) => (entry.id === params.id ? updated : entry)));
    return jsonResponse(request, { property: updated });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to update property.", details: String(error) }, { status: 500 });
  }
}

function imagePathsNextPhotoNumber(images: string[], coverImage?: string): number {
  return images.filter((image) => image !== coverImage).length + 1;
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const existing = await readProperties();
    const property = existing.find((entry) => entry.id === params.id);
    if (!property) return jsonResponse(request, { error: "Property not found." }, { status: 404 });

    await updateCollection<Property>(getDataFilePath("properties.json"), (current) => current.filter((entry) => entry.id !== params.id));
    return jsonResponse(request, { success: true });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to delete property.", details: String(error) }, { status: 500 });
  }
}
