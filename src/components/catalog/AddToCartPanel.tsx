"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { VariantPicker } from "./VariantPicker";
import { useCart } from "@/components/cart/CartProvider";
import type { AttributeMap, Product } from "@/lib/catalog";
import {
  defaultSelection,
  matchingVariant,
  optionLabel,
} from "@/lib/catalog/variants";
import { siteConfig } from "@/lib/config";

export function AddToCartPanel({
  product,
  selected: selectedProp,
  onSelectedChange,
}: {
  product: Product;
  selected?: AttributeMap;
  onSelectedChange?: (next: AttributeMap) => void;
}) {
  const { add } = useCart();
  const variants = product.variants;
  const [internal, setInternal] = useState<AttributeMap>(() =>
    variants && variants.length > 0 ? defaultSelection(variants) : {},
  );
  const selected = selectedProp ?? internal;
  const setSelected = onSelectedChange ?? setInternal;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => (variants && variants.length > 0 ? matchingVariant(variants, selected) : undefined),
    [variants, selected],
  );
  const price = variant?.price ?? product.price;
  const inStock = variant ? variant.stock > 0 : product.inStock;

  const submit = () => {
    add({
      productId: product.id,
      variantId: variant?.id,
      quantity,
      snapshot: {
        slug: product.slug,
        name: product.name,
        price,
        compareAtPrice: product.compareAtPrice,
        imageUrl: variant?.imageUrls?.[0] ?? product.imageUrls[0],
        optionLabel: variant ? optionLabel(variant.attributes) : undefined,
      },
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="flex flex-col gap-5">
      {variants && variants.length > 0 && (
        <VariantPicker variants={variants} selected={selected} onChange={setSelected} />
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <QuantityStepper value={quantity} onChange={setQuantity} max={20} />
        <Button
          type="button"
          onClick={submit}
          disabled={!inStock || (Boolean(variants && variants.length > 0) && !variant)}
          className="flex-1 sm:flex-none sm:min-w-44"
        >
          {!inStock ? (
            "Sold out"
          ) : added ? (
            <>
              <Check size={14} strokeWidth={2} />
              Added to cart
            </>
          ) : (
            <>
              <ShoppingBag size={14} strokeWidth={1.5} />
              Add to cart
            </>
          )}
        </Button>
      </div>

      {added ? (
        <p className="animate-fade-in text-[11px] text-ink-muted">
          Added.{" "}
          <Link href="/cart" className="text-clay underline decoration-clay/40 underline-offset-2">
            View cart
          </Link>{" "}
          or keep browsing.
        </p>
      ) : (
        <p className="text-[11px] text-ink-faint">
          {inStock ? siteConfig.deliveryNote : "Out of stock. Message support if you want a restock ping."}
        </p>
      )}
    </div>
  );
}
