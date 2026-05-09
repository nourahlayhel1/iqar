import { corsOptions, jsonResponse } from "@/lib/api-response";
import { savePropertyImages } from "@/lib/property-images";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");
    const title = formData.get("title");
    const photoNumber = Number(formData.get("photoNumber") ?? "1");
    const useAsCover = formData.get("useAsCover") === "true";

    if (!(image instanceof File) || image.size <= 0) {
      return jsonResponse(request, { error: "Image file is required." }, { status: 400 });
    }

    const [uploadedImage] = await savePropertyImages(
      typeof title === "string" ? title : "property",
      [image],
      useAsCover ? 0 : undefined,
      Number.isInteger(photoNumber) && photoNumber > 0 ? photoNumber : 1
    );

    return jsonResponse(request, { imagePath: uploadedImage.imagePath });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to upload property image.", details: String(error) }, { status: 500 });
  }
}
