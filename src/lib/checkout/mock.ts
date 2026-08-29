import { saveOrder } from "@/lib/orders/storage";
import type { Order } from "@/lib/orders/types";
import type { CreateOrderInput, CreateOrderResult } from "./types";

function deliveryDateFromNow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  return date.toISOString().slice(0, 10);
}

function buildOrder(input: CreateOrderInput): Order {
  const id = String(Math.floor(10000 + Math.random() * 90000));
  const trackingNumber = `RK-${id}`;

  return {
    id,
    trackingNumber,
    placedAt: new Date().toISOString(),
    status: "processing",
    deliveryDate: deliveryDateFromNow(),
    address: {
      name: input.customer.name,
      line: input.customer.address,
      city: input.customer.city,
      region: input.customer.region,
    },
    shipping: input.shipping,
    subtotal: input.subtotal,
    total: input.total,
    lines: input.lines.map((line) => ({
      productId: line.productId,
      slug: line.slug,
      name: line.name,
      imageUrl: line.imageUrl,
      quantity: line.quantity,
      unitPrice: line.price,
      attributes: line.attributes ?? {},
    })),
  };
}

export async function mockCreateOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const order = buildOrder(input);

  if (input.customerId) {
    saveOrder(input.customerId, order);
  }

  return {
    ok: true,
    reference: order.trackingNumber ?? order.id,
    orderId: order.id,
    trackingNumber: order.trackingNumber ?? order.id,
  };
}
