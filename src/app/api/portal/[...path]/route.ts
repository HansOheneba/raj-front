import { NextRequest, NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api";
import { persistPortalSession, portalSessionCookieHeader } from "@/lib/portal-session";

async function proxy(request: NextRequest, path: string[]) {
  const target = `${apiBaseUrl()}/${path.join("/")}${request.nextUrl.search}`;
  const sessionCookie = await portalSessionCookieHeader();

  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (sessionCookie) headers.set("Cookie", sessionCookie);

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const response = await fetch(target, init);
  await persistPortalSession(response);

  const body = await response.arrayBuffer();
  const nextResponse = new NextResponse(body, { status: response.status });

  const responseType = response.headers.get("content-type");
  if (responseType) nextResponse.headers.set("content-type", responseType);

  return nextResponse;
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}
