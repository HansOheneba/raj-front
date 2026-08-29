export type OrderStatus = "processing" | "packed" | "on_the_way" | "delivered" | "cancelled";

export type OrderLine = {
  productId: string;
  slug: string;
  name: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  attributes: Record<string, string>;
};

export type OrderAddress = {
  name: string;
  line: string;
  city?: string;
  region: string;
};

export type Rider = {
  name: string;
};

export type TrackingStepState = "done" | "current" | "pending";

export type TrackingStep = {
  title: string;
  detail?: string;
  at?: string;
  state: TrackingStepState;
};

export type Order = {
  id: string;
  trackingNumber?: string;
  placedAt: string;
  status: OrderStatus;
  deliveryDate: string;
  address: OrderAddress;
  rider?: Rider;
  shipping: number;
  subtotal: number;
  total: number;
  lines: OrderLine[];
};
