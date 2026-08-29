export const GOOGLE_MAPS_OPEN_URL = "https://maps.google.com/maps";

export function normalizeMapsUrl(
  value: string,
): { ok: true; url?: string } | { ok: false } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: true };

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false };

    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const path = url.pathname.toLowerCase();
    const isMaps =
      host === "maps.google.com" ||
      host === "maps.app.goo.gl" ||
      host === "goo.gl" ||
      ((host === "google.com" || host.endsWith(".google.com") || host === "google.com.gh") &&
        path.includes("/maps"));

    if (!isMaps) return { ok: false };
    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false };
  }
}
