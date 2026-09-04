export type {
  Order,
  OrderAddress,
  OrderLine,
  OrderStatus,
  Rider,
  TrackingStep,
  TrackingStepState,
} from "./types";
export { isCurrentOrder, mockOrders } from "./mock";
export {
  formatDeliveryDate,
  formatOrderPlacedAt,
  normalizeTrackingNumber,
  orderStatusClass,
  orderStatusLabel,
} from "./format";
export { trackingTimeline } from "./timeline";

import { isApiEnabled } from "@/lib/api";

import * as httpOrders from "./http";
import * as localOrders from "./local";

const useHttp = isApiEnabled;

export async function listOrdersForCustomer(customerId: string) {
  return useHttp
    ? httpOrders.listOrdersForCustomer(customerId)
    : localOrders.listOrdersForCustomer(customerId);
}

export async function listCurrentOrdersForCustomer(customerId: string) {
  return useHttp
    ? httpOrders.listCurrentOrdersForCustomer(customerId)
    : localOrders.listCurrentOrdersForCustomer(customerId);
}

export async function getOrderById(id: string, customerId?: string) {
  return useHttp
    ? httpOrders.getOrderById(id, customerId)
    : localOrders.getOrderById(id, customerId);
}

export async function getOrderByTrackingNumber(value: string) {
  return useHttp
    ? httpOrders.getOrderByTrackingNumber(value)
    : localOrders.getOrderByTrackingNumber(value);
}
