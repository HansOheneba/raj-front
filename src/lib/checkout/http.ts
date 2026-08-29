import type { CreateOrderInput, CreateOrderResult } from "./types";

const baseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
  }
  return url.replace(/\/$/, "");
};

/**
 * Storefront never talks to Hubtel. POST the order to admin; admin charges and returns a reference.
 */
export async function httpCreateOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const response = await fetch(`${baseUrl()}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    return { ok: false, message: "The order could not be placed. Try again or message support." };
  }

  const payload = (await response.json()) as {
    reference?: string;
    orderId?: string;
    trackingNumber?: string;
  };

  const reference = payload.reference ?? payload.trackingNumber ?? "pending";
  const orderId = payload.orderId ?? reference;
  const trackingNumber = payload.trackingNumber ?? reference;

  return { ok: true, reference, orderId, trackingNumber };
}
