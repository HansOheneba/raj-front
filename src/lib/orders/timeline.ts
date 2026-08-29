import { formatDeliveryDate } from "./format";
import type { Order, TrackingStep } from "./types";

const WAREHOUSE = "Accra warehouse";

function addHours(iso: string, hours: number): string {
  return new Date(Date.parse(iso) + hours * 60 * 60 * 1000).toISOString();
}

function isLocalAccra(region: string): boolean {
  return region === "Greater Accra";
}

function withState(steps: Omit<TrackingStep, "state">[], currentIndex: number): TrackingStep[] {
  return steps.map((step, index) => ({
    ...step,
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "pending",
  }));
}

export function trackingTimeline(order: Order): TrackingStep[] {
  const local = isLocalAccra(order.address.region);
  const packedAt = addHours(order.placedAt, 18);
  const assignedAt = addHours(order.placedAt, 42);
  const outAt = addHours(order.placedAt, 44);
  const deliveredAt = `${order.deliveryDate}T14:20:00.000Z`;
  const expected = `Expected ${formatDeliveryDate(order.deliveryDate)}`;

  if (order.status === "cancelled") {
    return [
      {
        title: "Order received",
        detail: WAREHOUSE,
        at: order.placedAt,
        state: "done",
      },
      {
        title: "Cancelled",
        state: "current",
      },
    ];
  }

  const received: Omit<TrackingStep, "state"> = {
    title: "Order received",
    detail: WAREHOUSE,
    at: order.placedAt,
  };

  const packed: Omit<TrackingStep, "state"> = {
    title: "Packed",
    detail: WAREHOUSE,
    at: packedAt,
  };

  const assigned: Omit<TrackingStep, "state"> = order.rider
    ? {
        title: "Assigned to a rider",
        detail: order.rider.name,
        at: assignedAt,
      }
    : {
        title: "Assigned to a rider",
        detail: "A rider will pick this up from the warehouse.",
      };

  const outForDelivery: Omit<TrackingStep, "state"> = {
    title: "Out for delivery",
    detail: local ? "On the way to you." : `On the way in ${order.address.region}.`,
    at: outAt,
  };

  const leftWarehouse: Omit<TrackingStep, "state"> = {
    title: "Left Accra warehouse",
    detail: `On the way to ${order.address.region}.`,
    at: assignedAt,
  };

  const delivered: Omit<TrackingStep, "state"> = {
    title: "Delivered",
    at: deliveredAt,
  };

  const steps = local
    ? [received, packed, assigned, outForDelivery, delivered]
    : [received, packed, leftWarehouse, assigned, outForDelivery, delivered];

  const currentIndex = ((): number => {
    switch (order.status) {
      case "processing":
        return 0;
      case "packed":
        return 1;
      case "on_the_way":
        if (local) return order.rider ? 3 : 2;
        return order.rider ? 4 : 2;
      case "delivered":
        return steps.length - 1;
      default:
        return 0;
    }
  })();

  return withState(steps, currentIndex).map((step, index, all) => {
    if (step.state !== "pending") return step;
    return {
      title: step.title,
      detail: index === all.length - 1 ? expected : step.detail,
      state: "pending" as const,
    };
  });
}
