import type { Order } from "./types";

const STORAGE_KEY = "raj-kollections.orders.v1";

type OrdersStore = Record<string, Order[]>;

const isOrder = (value: unknown): value is Order => {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Order;
  return (
    typeof row.id === "string" &&
    typeof row.placedAt === "string" &&
    typeof row.status === "string" &&
    Array.isArray(row.lines)
  );
};

const readStore = (): OrdersStore => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const store: OrdersStore = {};
    for (const [customerId, orders] of Object.entries(parsed)) {
      if (!Array.isArray(orders)) continue;
      store[customerId] = orders.filter(isOrder);
    }
    return store;
  } catch {
    return {};
  }
};

const writeStore = (store: OrdersStore) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Private browsing: orders will not persist.
  }
};

export function readOrdersForCustomer(customerId: string): Order[] {
  return readStore()[customerId] ?? [];
}

export function readAllStoredOrders(): Order[] {
  return Object.values(readStore()).flat();
}

export function saveOrder(customerId: string, order: Order): void {
  const store = readStore();
  const existing = store[customerId] ?? [];
  store[customerId] = [order, ...existing];
  writeStore(store);
}
