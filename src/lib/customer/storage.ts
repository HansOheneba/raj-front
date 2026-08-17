import type { Customer, CustomerAddress, CustomerRecord } from "./types";

const CUSTOMERS_KEY = "raj-kollections.customers.v2";
const SESSION_KEY = "raj-kollections.session.v1";
const ADDRESSES_KEY = "raj-kollections.addresses.v1";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

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
    typeof row.email === "string" &&
    typeof row.phone === "string"
  );
};

const isAddress = (value: unknown): value is CustomerAddress => {
  if (typeof value !== "object" || value === null) return false;
  const row = value as CustomerAddress;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.phone === "string" &&
    typeof row.region === "string" &&
    typeof row.line === "string"
  );
};

export const toCustomer = (record: CustomerRecord): Customer => ({
  id: record.id,
  name: record.name,
  email: record.email,
  phone: record.phone,
});

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
      store[customerId] = items.filter(isAddress).map((item) => ({
        ...item,
        label: item.label?.trim() || "Saved address",
        isDefault: Boolean(item.isDefault),
      }));
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
