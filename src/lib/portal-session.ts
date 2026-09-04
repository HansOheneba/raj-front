import { cookies } from "next/headers";

export const PORTAL_SESSION_COOKIE = "rk_portal_session";
const PORTAL_SESSION_NAME = "rk_customer_session";

/** Match portal sliding session window (400 days). */
export const PORTAL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 400;

type ParsedSessionCookie = {
  value: string;
  maxAge: number;
};

function readSetCookies(response: Response): string[] {
  return typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [];
}

function parseSessionCookie(setCookies: string[]): ParsedSessionCookie | null {
  for (const header of setCookies) {
    const valueMatch = header.match(new RegExp(`^${PORTAL_SESSION_NAME}=([^;]+)`));
    if (!valueMatch?.[1]) continue;

    const maxAgeMatch = header.match(/(?:^|;)\s*Max-Age=(\d+)/i);
    const maxAge = maxAgeMatch
      ? Number.parseInt(maxAgeMatch[1], 10)
      : PORTAL_SESSION_MAX_AGE_SECONDS;

    return { value: valueMatch[1], maxAge };
  }
  return null;
}

export function parsePortalSession(setCookies: string[]): string | null {
  return parseSessionCookie(setCookies)?.value ?? null;
}

export async function portalSessionCookieHeader(): Promise<string | null> {
  const value = (await cookies()).get(PORTAL_SESSION_COOKIE)?.value;
  if (!value) return null;
  return `${PORTAL_SESSION_NAME}=${value}`;
}

export async function persistPortalSession(response: Response): Promise<void> {
  const session = parseSessionCookie(readSetCookies(response));
  if (!session) return;

  if (session.maxAge <= 0) {
    await clearPortalSession();
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
}

export async function clearPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_SESSION_COOKIE);
}
