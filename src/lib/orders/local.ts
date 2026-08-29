import { isCurrentOrder } from "./mock";
import { mockOrders } from "./mock";
import { normalizeTrackingNumber } from "./format";
import { readAllStoredOrders, readOrdersForCustomer } from "./storage";
import type { Order } from "./types";

export function listOrdersForCustomer(customerId: string): Order[] {
  return readOrdersForCustomer(customerId);
}

export function listCurrentOrdersForCustomer(customerId: string): Order[] {
  return listOrdersForCustomer(customerId).filter(isCurrentOrder);
}

export function getOrderById(id: string, customerId?: string): Order | undefined {
  const orderId = id.trim();
  if (!orderId) return undefined;

  if (customerId) {
    return readOrdersForCustomer(customerId).find((order) => order.id === orderId);
  }

  return readAllStoredOrders().find((order) => order.id === orderId);
}

export function getOrderByTrackingNumber(value: string): Order | undefined {
  const trackingNumber = normalizeTrackingNumber(value);
  if (!trackingNumber) return undefined;

  const stored = readAllStoredOrders().find((order) => order.trackingNumber === trackingNumber);
  if (stored) return stored;

  return mockOrders.find((order) => order.trackingNumber === trackingNumber);
}
