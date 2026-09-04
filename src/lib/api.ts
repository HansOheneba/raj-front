const DEFAULT_API_URL = "https://portal.rajkollections.com";

export const isApiEnabled = Boolean(process.env.NEXT_PUBLIC_API_URL);

export function apiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return url.replace(/\/$/, "");
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiInit = RequestInit & {
  next?: { revalidate?: number | false; tags?: string[] };
};

function sessionRequestUrl(path: string): string {
  if (typeof window !== "undefined") {
    return `/api/portal${path}`;
  }
  return `${apiBaseUrl()}${path}`;
}

function buildSessionHeaders(init?: ApiInit): Headers {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const method = (init?.method ?? "GET").toUpperCase();
  const hasBody = init?.body !== undefined && init?.body !== null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Avoid CORS preflight on GET/DELETE by not sending Content-Type without a body.
  if (!hasBody && (method === "GET" || method === "HEAD" || method === "DELETE")) {
    headers.delete("Content-Type");
  }

  return headers;
}

async function parseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  return body.error ?? `Request failed (${response.status})`;
}

async function readBody<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/** Session-aware requests: auth, orders, addresses, saved items. */
export async function api<T>(path: string, init?: ApiInit): Promise<T> {
  const response = await fetch(sessionRequestUrl(path), {
    ...init,
    credentials: "include",
    headers: buildSessionHeaders(init),
  });

  return readBody<T>(response);
}

/** Public catalog reads — cached on the server, no session cookie required. */
export async function apiPublic<T>(path: string, init?: ApiInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    next: init?.next ?? { revalidate: 60 },
  });

  return readBody<T>(response);
}

/** Same as apiPublic, but a 404 means "no such record" instead of an error. */
export async function apiPublicOptional<T>(
  path: string,
  init?: ApiInit,
): Promise<T | undefined> {
  try {
    return await apiPublic<T>(path, init);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}
