import { normalizeTrackingNumber } from "./format";
import type { Order } from "./types";

const baseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Orders request failed: ${response.status} ${path}`);
  }
  return response.json() as Promise<T>;
}

export async function listOrdersForCustomer(_customerId: string): Promise<Order[]> {
  return getJson<Order[]>("/orders");
}

export async function listCurrentOrdersForCustomer(customerId: string): Promise<Order[]> {
  const orders = await listOrdersForCustomer(customerId);
  const currentStatuses = new Set(["processing", "packed", "on_the_way"]);
  return orders.filter((order) => currentStatuses.has(order.status));
}

export async function getOrderById(id: string, _customerId?: string): Promise<Order | undefined> {
  const orderId = id.trim();
  if (!orderId) return undefined;
  try {
    return await getJson<Order>(`/orders/${encodeURIComponent(orderId)}`);
  } catch {
    return undefined;
  }
}

export async function getOrderByTrackingNumber(value: string): Promise<Order | undefined> {
  const trackingNumber = normalizeTrackingNumber(value);
  if (!trackingNumber) return undefined;
  try {
    return await getJson<Order>(`/orders/track/${encodeURIComponent(trackingNumber)}`);
  } catch {
    return undefined;
  }
}
