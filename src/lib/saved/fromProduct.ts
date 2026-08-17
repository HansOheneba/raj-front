import type { CartSnapshot } from "@/lib/cart/types";
import type { Product, ProductVariant } from "@/lib/catalog";
import { optionLabel } from "@/lib/catalog/variants";
import type { SavedItem } from "./types";

export function savedItemFromProduct(product: Product, variant?: ProductVariant): SavedItem {
  return {
    productId: product.id,
    variantId: variant?.id,
    snapshot: {
      slug: product.slug,
      name: product.name,
      price: variant?.price ?? product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: variant?.imageUrls?.[0] ?? product.imageUrls[0],
      optionLabel: variant ? optionLabel(variant.attributes) : undefined,
    },
    savedAt: new Date().toISOString(),
  };
}

export function savedItemFromLine(line: {
  productId: string;
  variantId?: string;
  snapshot: CartSnapshot;
}): SavedItem {
  return {
    productId: line.productId,
    variantId: line.variantId,
    snapshot: line.snapshot,
    savedAt: new Date().toISOString(),
  };
}
