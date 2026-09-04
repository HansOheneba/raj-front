import { parseGhanaPhone } from "@/lib/phone";
import type { Customer, CustomerAddress, CustomerRecord } from "./types";

const CUSTOMERS_KEY = "raj-kollections.customers.v2";
const SESSION_KEY = "raj-kollections.session.v1";
const ADDRESSES_KEY = "raj-kollections.addresses.v1";
const EMAIL_TOKENS_KEY = "raj-kollections.email-tokens.v1";

export const normalizePhone = (phone: string) => parseGhanaPhone(phone);

export async function hashValue(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function hashesMatch(left: string, right: string) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

const isRecord = (value: unknown): value is CustomerRecord => {
  if (typeof value !== "object" || value === null) return false;
  const row = value as CustomerRecord;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.phone === "string" &&
    (row.email === undefined || typeof row.email === "string") &&
    (row.pendingEmail === undefined || typeof row.pendingEmail === "string") &&
    (row.dateOfBirth === undefined || typeof row.dateOfBirth === "string")
  );
};

const isAddress = (value: unknown): value is CustomerAddress & { district?: string } => {
  if (typeof value !== "object" || value === null) return false;
  const row = value as CustomerAddress & { district?: string };
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.phone === "string" &&
    typeof row.region === "string" &&
    typeof row.line === "string" &&
    (row.city === undefined || typeof row.city === "string")
  );
};

export const toCustomer = (record: CustomerRecord): Customer => ({
  id: record.id,
  name: record.name,
  phone: record.phone,
  email: record.email,
  pendingEmail: record.pendingEmail,
  dateOfBirth: record.dateOfBirth,
});

export type EmailVerificationToken = {
  token: string;
  customerId: string;
  email: string;
  expiresAt: number;
};

const isEmailToken = (value: unknown): value is EmailVerificationToken => {
  if (typeof value !== "object" || value === null) return false;
  const row = value as EmailVerificationToken;
  return (
    typeof row.token === "string" &&
    typeof row.customerId === "string" &&
    typeof row.email === "string" &&
    typeof row.expiresAt === "number"
  );
};

export const readEmailTokens = (): EmailVerificationToken[] => {
  try {
    const raw = window.localStorage.getItem(EMAIL_TOKENS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEmailToken);
  } catch {
    return [];
  }
};

export const writeEmailTokens = (tokens: EmailVerificationToken[]) => {
  window.localStorage.setItem(EMAIL_TOKENS_KEY, JSON.stringify(tokens));
};

export const readCustomers = (): CustomerRecord[] => {
  try {
    const raw = window.localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord);
  } catch {
    return [];
  }
};

export const writeCustomers = (customers: CustomerRecord[]) => {
  window.localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
};

export const readSessionId = (): string | null => {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const id = (parsed as { customerId?: unknown }).customerId;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
};

export const writeSessionId = (customerId: string | null) => {
  if (!customerId) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ customerId }));
};

type AddressStore = Record<string, CustomerAddress[]>;

const readAddressStore = (): AddressStore => {
  try {
    const raw = window.localStorage.getItem(ADDRESSES_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    const store: AddressStore = {};
    for (const [customerId, items] of Object.entries(parsed)) {
      if (!Array.isArray(items)) continue;
      store[customerId] = items.filter(isAddress).map((item) => {
        const legacyDistrict =
          typeof (item as { district?: unknown }).district === "string"
            ? (item as { district: string }).district.trim()
            : "";
        const city =
          typeof item.city === "string" && item.city.trim()
            ? item.city.trim()
            : legacyDistrict;

        return {
          id: item.id,
          label: item.label?.trim() || "Saved address",
          name: item.name,
          phone: item.phone,
          region: item.region,
          city,
          line: item.line,
          mapsUrl: item.mapsUrl,
          isDefault: Boolean(item.isDefault),
        };
      });
    }
    return store;
  } catch {
    return {};
  }
};

export const readAddresses = (customerId: string): CustomerAddress[] =>
  readAddressStore()[customerId] ?? [];

export const writeAddresses = (customerId: string, addresses: CustomerAddress[]) => {
  const store = readAddressStore();
  store[customerId] = addresses;
  window.localStorage.setItem(ADDRESSES_KEY, JSON.stringify(store));
};
