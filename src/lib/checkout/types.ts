export type CheckoutCustomer = {
  name: string;
  phone: string;
  email: string;
  region: string;
  city: string;
  address: string;
  mapsUrl?: string;
  notes?: string;
};

export type CheckoutLine = {
  productId: string;
  variantId?: string;
  slug: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
  attributes?: Record<string, string>;
};

export type CreateOrderInput = {
  customerId?: string;
  customer: CheckoutCustomer;
  lines: CheckoutLine[];
  subtotal: number;
  shipping: number;
  total: number;
};

export type CreateOrderResult =
  | {
      ok: true;
      reference: string;
      orderId: string;
      trackingNumber: string;
      paymentStatus?: "pending" | "paid" | "demo";
      paymentMessage?: string;
    }
  | { ok: false; message: string };
