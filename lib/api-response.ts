import { NextResponse } from "next/server";

const DEV_ORIGIN = "http://localhost:4200";

function shouldApplyCors(request: Request): boolean {
  return process.env.NODE_ENV !== "production" && request.headers.get("origin") === DEV_ORIGIN;
}

export function withCors(response: NextResponse, request: Request): NextResponse {
  if (!shouldApplyCors(request)) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", DEV_ORIGIN);
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
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
