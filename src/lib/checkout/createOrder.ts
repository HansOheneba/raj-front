export type CheckoutCustomer = {
  name: string;
  phone: string;
  email: string;
  region: string;
  address: string;
  notes?: string;
};

export type CheckoutLine = {
  productId: string;
  variantId?: string;
  quantity: number;
  name: string;
  price: number;
};

export type CreateOrderInput = {
  customer: CheckoutCustomer;
  lines: CheckoutLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

export type CreateOrderResult =
  | { ok: true; reference: string }
  | { ok: false; message: string };

/**
 * Storefront never talks to Hubtel. When admin is live, POST the order there.
 * Admin charges, stores, and returns a reference.
 */
export async function createOrder(_input: CreateOrderInput): Promise<CreateOrderResult> {
  const adminUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!adminUrl) {
    return {
      ok: false,
      message: "Checkout is not connected yet. The admin API will take this order and charge via Hubtel.",
    };
  }

  const response = await fetch(`${adminUrl.replace(/\/$/, "")}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(_input),
  });

  if (!response.ok) {
    return { ok: false, message: "The order could not be placed. Try again or message support." };
  }

  const payload = (await response.json()) as { reference?: string };
  return { ok: true, reference: payload.reference ?? "pending" };
}
