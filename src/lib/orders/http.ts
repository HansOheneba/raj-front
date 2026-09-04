import { api } from "@/lib/api";
import { normalizeTrackingNumber } from "./format";
import type { Order } from "./types";

export async function listOrdersForCustomer(_customerId: string): Promise<Order[]> {
  return api<Order[]>("/orders");
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
    return await api<Order>(`/orders/${encodeURIComponent(orderId)}`);
  } catch {
    return undefined;
  }
}

export async function getOrderByTrackingNumber(value: string): Promise<Order | undefined> {
  const trackingNumber = normalizeTrackingNumber(value);
  if (!trackingNumber) return undefined;
  try {
    return await api<Order>(`/orders/track/${encodeURIComponent(trackingNumber)}`);
  } catch {
    return undefined;
  }
}
