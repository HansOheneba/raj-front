const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_OF_BIRTH_MIN_YEAR = 1900;
export const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function startOfLocalDay(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dateOfBirthBounds() {
  const today = startOfLocalDay();
  return {
    min: new Date(DATE_OF_BIRTH_MIN_YEAR, 0, 1),
    max: today,
  };
}

export function isValidDateOfBirth(value: string): boolean {
  const date = parseISODate(value);
  if (!date) return false;
  const { min, max } = dateOfBirthBounds();
  return date >= min && date <= max;
}

export function formatDateOfBirth(value: string): string {
  const date = parseISODate(value);
  if (!date) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
