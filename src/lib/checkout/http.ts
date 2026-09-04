import { api } from "@/lib/api";
import { toApiPhone } from "@/lib/phone";
import type { CreateOrderInput, CreateOrderResult } from "./types";

type CreateOrderResponse = {
  reference?: string;
  orderId?: string;
  trackingNumber?: string;
  paymentReference?: string;
  paymentStatus?: "pending" | "paid" | "demo";
  paymentMessage?: string;
  error?: string;
};

/**
 * Storefront never talks to Hubtel. POST the order to the portal; payment starts server-side.
 */
export async function httpCreateOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const phone = toApiPhone(input.customer.phone);
  if (!phone) {
    return { ok: false, message: "Enter a valid phone number." };
  }

  try {
    const payload = await api<CreateOrderResponse>("/orders", {
      method: "POST",
      body: JSON.stringify({
        ...input,
        customer: {
          ...input.customer,
          phone,
        },
      }),
    });

    const reference = payload.reference ?? payload.trackingNumber ?? "pending";
    const orderId = payload.orderId ?? reference;
    const trackingNumber = payload.trackingNumber ?? reference;

    return {
      ok: true,
      reference,
      orderId,
      trackingNumber,
      paymentStatus: payload.paymentStatus,
      paymentMessage: payload.paymentMessage,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "The order could not be placed. Try again or message support.";
    return { ok: false, message };
  }
}
