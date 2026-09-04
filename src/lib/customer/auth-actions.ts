"use server";

import { apiBaseUrl } from "@/lib/api";
import {
  clearPortalSession,
  persistPortalSession,
  portalSessionCookieHeader,
} from "@/lib/portal-session";
import type {
  Customer,
  RequestCodeInput,
  RequestCodeResponse,
  VerifyCodeResult,
} from "./types";

function logAuth(...args: unknown[]) {
  if (process.env.NODE_ENV === "development") {
    console.log("[auth]", ...args);
  }
}

export async function requestAuthCodeAction(
  input: RequestCodeInput,
): Promise<RequestCodeResponse> {
  const url = `${apiBaseUrl()}/auth/request-code`;

  logAuth("POST /auth/request-code");
  logAuth("phone:", input.phone);
  if (input.profile) {
    logAuth("profile:", input.profile);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  });

  const raw = await response.text();
  let body: RequestCodeResponse & { error?: string };
  try {
    body = JSON.parse(raw) as RequestCodeResponse & { error?: string };
  } catch {
    body = { ok: false, error: raw || "Invalid JSON response" };
  }

  logAuth("status:", response.status);
  logAuth("response:", body);

  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  return body;
}

export async function verifyAuthCodeAction(
  phone: string,
  code: string,
): Promise<VerifyCodeResult> {
  logAuth("POST /auth/verify-code");
  logAuth("phone:", phone);

  const response = await fetch(`${apiBaseUrl()}/auth/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ phone, code }),
  });

  const raw = await response.text();
  let body: (VerifyCodeResult & { error?: string }) | null = null;
  try {
    body = JSON.parse(raw) as VerifyCodeResult & { error?: string };
  } catch {
    body = null;
  }

  logAuth("status:", response.status);
  logAuth("response:", body ?? raw);

  if (!response.ok) {
    const apiError = (body as { error?: string } | null)?.error;
    throw new Error(apiError ?? `Request failed (${response.status})`);
  }

  if (!body?.ok) {
    throw new Error("That code doesn't match. Try again.");
  }

  await persistPortalSession(response);
  return body;
}

export async function completeProfileAction(name: string): Promise<{ customer: Customer }> {
  const sessionCookie = await portalSessionCookieHeader();

  const response = await fetch(`${apiBaseUrl()}/auth/complete-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(sessionCookie ? { Cookie: sessionCookie } : {}),
    },
    body: JSON.stringify({ name }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    customer?: Customer;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }

  await persistPortalSession(response);
  if (!body.customer) {
    throw new Error("Profile could not be saved.");
  }

  return { customer: body.customer };
}

export async function logoutAction(): Promise<void> {
  const sessionCookie = await portalSessionCookieHeader();

  if (sessionCookie) {
    try {
      await fetch(`${apiBaseUrl()}/auth/logout`, {
        method: "POST",
        headers: { Cookie: sessionCookie },
      });
    } catch {
      // Clear local session even if portal logout fails.
    }
  }

  await clearPortalSession();
}
