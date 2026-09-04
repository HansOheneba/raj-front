const COUNTRY_CODE = "233";

export function parseGhanaPhone(value: string): string | null {
  const national = ghanaNationalNumber(value);
  if (national.length !== 9) return null;
  return `+${COUNTRY_CODE}${national}`;
}

export function ghanaNationalNumber(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith(COUNTRY_CODE)) digits = digits.slice(COUNTRY_CODE.length);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 9);
}

export function formatGhanaPhone(value: string): string {
  const parsed = parseGhanaPhone(value);
  if (!parsed) return value;
  const national = parsed.slice(`+${COUNTRY_CODE}`.length);
  return `+${COUNTRY_CODE} ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}

/** Portal API format: 233XXXXXXXXX (no +). */
export function toApiPhone(value: string): string | null {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith(COUNTRY_CODE)) {
    digits = digits.slice(COUNTRY_CODE.length);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length !== 9) return null;
  return `${COUNTRY_CODE}${digits}`;
}
