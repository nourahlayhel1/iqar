import path from "path";
import { getSupabaseStorageClient } from "@/utils/supabase/storage";

const propertyImagesBucket = "property-images";
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const extensionByMimeType: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif"
};

function slugifyFolderName(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "property";
}

function getImageExtension(file: File): string {
  const parsed = path.parse(file.name || "image");
  return (parsed.ext || extensionByMimeType[file.type] || ".jpg").toLowerCase();
}

export async function readPropertyRequestPayload(request: Request): Promise<{
  payload: unknown;
  imageFiles: File[];
  coverImageUploadIndex?: number;
}> {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType.includes("multipart/form-data")) {
    return { payload: await request.json(), imageFiles: [], coverImageUploadIndex: undefined };
  }

  const formData = await request.formData();
  const rawPayload = formData.get("payload");
  const payload = typeof rawPayload === "string" ? JSON.parse(rawPayload) : {};
  const imageFiles = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const rawCoverImageUploadIndex = formData.get("coverImageUploadIndex");
  const coverImageUploadIndex =
    typeof rawCoverImageUploadIndex === "string" && rawCoverImageUploadIndex.trim()
      ? Number(rawCoverImageUploadIndex)
      : undefined;

  return {
    payload,
    imageFiles,
    coverImageUploadIndex: Number.isInteger(coverImageUploadIndex) ? coverImageUploadIndex : undefined
  };
}

export async function savePropertyImages(
  propertyTitle: string,
  imageFiles: File[],
  coverImageUploadIndex?: number,
  startingPhotoNumber = 1
): Promise<Array<{ originalName: string; imagePath: string }>> {
  if (!imageFiles.length) return [];

  const supabase = getSupabaseStorageClient();
  const folderName = slugifyFolderName(propertyTitle);

  let nextPhotoNumber = startingPhotoNumber;

  return Promise.all(
    imageFiles.map(async (file, index) => {
      if (!allowedImageTypes.has(file.type)) {
        throw new Error(`Unsupported image type: ${file.type || file.name}`);
      }

      const extension = getImageExtension(file);
      const fileName =
        index === coverImageUploadIndex || (coverImageUploadIndex === undefined && index === 0 && startingPhotoNumber === 1)
          ? `cover${extension}`
          : `photo-${nextPhotoNumber++}${extension}`;
      const storagePath = `${folderName}/${fileName}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      const { error } = await supabase.storage.from(propertyImagesBucket).upload(storagePath, bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: true
      });

      if (error) {
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      const { data } = supabase.storage.from(propertyImagesBucket).getPublicUrl(storagePath);

      return {
        originalName: file.name,
        imagePath: data.publicUrl
      };
    })
  );
}
