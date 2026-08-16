export type CartSnapshot = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  optionLabel?: string;
};

export type CartLine = {
  productId: string;
  variantId?: string;
  quantity: number;
  snapshot: CartSnapshot;
};

export const cartLineKey = (productId: string, variantId?: string) =>
  `${productId}::${variantId ?? ""}`;
