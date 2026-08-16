"use client";

import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/catalog";
import { needsVariantChoice, optionLabel } from "@/lib/catalog/variants";

export function QuickAddButton({ product }: { product: Product }) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const chooseOnPdp = needsVariantChoice(product.variants);
  const defaultVariant = product.variants?.[0];

  const quickAdd = () => {
    add({
      productId: product.id,
      variantId: defaultVariant?.id,
      snapshot: {
        slug: product.slug,
        name: product.name,
        price: defaultVariant?.price ?? product.price,
        compareAtPrice: product.compareAtPrice,
        imageUrl: defaultVariant?.imageUrls?.[0] ?? product.imageUrls[0],
        optionLabel: defaultVariant ? optionLabel(defaultVariant.attributes) : undefined,
      },
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  if (!product.inStock) return null;

  const className = cn(
    "absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md border border-line-strong bg-cream/95 text-ink shadow-soft backdrop-blur-[2px] transition-[background-color,color,border-color,opacity] duration-[var(--duration-ui)] ease-[var(--ease-out)]",
    "opacity-0 focus-visible:opacity-100 max-md:opacity-100",
    "[@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100",
    justAdded && "border-clay bg-clay text-cream opacity-100",
  );

  if (chooseOnPdp) {
    return (
      <Link href={`/product/${product.slug}`} aria-label={`Choose options for ${product.name}`} className={className}>
        <Plus size={14} strokeWidth={1.5} />
      </Link>
    );
  }

  return (
    <button type="button" onClick={quickAdd} aria-label={`Add ${product.name} to cart`} className={className}>
      {justAdded ? <Check size={13} strokeWidth={2} /> : <Plus size={14} strokeWidth={1.5} />}
    </button>
  );
}
