import { corsOptions, jsonResponse } from "@/lib/api-response";
import { readProperties, readRequests } from "@/lib/data";
import { findMatchesForRequest } from "@/lib/match";

export const runtime = "nodejs";

export async function OPTIONS(request: Request) {
  return corsOptions(request);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const [requests, properties] = await Promise.all([readRequests(), readProperties()]);
    const requestItem = requests.find((entry) => entry.id === params.id);
    if (!requestItem) return jsonResponse(request, { error: "Request not found." }, { status: 404 });
    return jsonResponse(request, { matches: findMatchesForRequest(properties, requestItem) });
  } catch (error) {
    return jsonResponse(request, { error: "Failed to find matches.", details: String(error) }, { status: 500 });
  }
}
