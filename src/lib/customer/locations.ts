import { getCities, isValidCity as isLibraryValidCity } from "ghana-locations";

/**
 * Well-known neighbourhoods not always listed as separate towns in ghana-locations.
 */
const supplementalCities: Record<string, readonly string[]> = {
  "Greater Accra": [
    "Airport Residential Area",
    "Burma Camp",
    "Cantonments",
    "East Legon",
    "Labone",
    "Legon",
    "North Legon",
    "Roman Ridge",
    "Ridge",
    "Sakumono",
    "Spintex",
    "West Legon",
  ],
};

export function getCitiesForRegion(region: string): string[] {
  let base: string[] = [];
  try {
    base = getCities(region);
  } catch {
    base = [];
  }

  const extra = supplementalCities[region] ?? [];
  return [...new Set([...base, ...extra])].sort((left, right) => left.localeCompare(right));
}

export function isValidCity(region: string, city: string): boolean {
  const trimmed = city.trim();
  if (!trimmed) return false;
  if (isLibraryValidCity(region, trimmed)) return true;

  return getCitiesForRegion(region).some(
    (item) => item.toLowerCase() === trimmed.toLowerCase(),
  );
}

export function formatLocationLine(parts: {
  line: string;
  city?: string;
  region: string;
}) {
  return [parts.line, parts.city, parts.region].filter(Boolean).join(", ");
}
