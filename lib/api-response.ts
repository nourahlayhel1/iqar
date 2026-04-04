import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:4200",
  "http://localhost:3000",
  "https://iqar-swxy.vercel.app"
]);

function getAllowedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : null;
}

export function withCors(response: NextResponse, request: Request): NextResponse {
  const allowedOrigin = getAllowedOrigin(request);
  if (!allowedOrigin) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Vary", "Origin");

  return response;
}

export function jsonResponse<T>(request: Request, body: T, init?: ResponseInit): NextResponse {
  return withCors(NextResponse.json(body, init), request);
}

export function corsOptions(request: Request): NextResponse {
  return withCors(new NextResponse(null, { status: 204 }), request);
}
