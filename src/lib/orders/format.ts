import { siteConfig } from "@/lib/config";
import type { OrderStatus } from "./types";

const placedFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const deliveryFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const orderStatusLabel: Record<OrderStatus, string> = {
  processing: "Processing",
  packed: "Packed",
  on_the_way: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const orderStatusClass: Record<OrderStatus, string> = {
  processing: "text-ink-muted",
  packed: "text-clay",
  on_the_way: "text-clay-dark",
  delivered: "text-ink",
  cancelled: "text-sale",
};

export function formatOrderPlacedAt(iso: string): string {
  const parts = placedFormatter.formatToParts(new Date(iso));
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("hour")}:${value("minute")}, ${value("month")} ${value("day")}, ${value("year")}`;
}

export function formatDeliveryDate(iso: string): string {
  return deliveryFormatter.format(new Date(iso));
}

export function normalizeTrackingNumber(value: string): string {
  return value.trim().toUpperCase();
}
