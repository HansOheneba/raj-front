import { cartLineKey, type CartSnapshot } from "@/lib/cart/types";

export type SavedItem = {
  productId: string;
  variantId?: string;
  snapshot: CartSnapshot;
  savedAt: string;
};

export const savedItemKey = (productId: string, variantId?: string) =>
  cartLineKey(productId, variantId);
