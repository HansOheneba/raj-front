"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { AddToCartPanel } from "./AddToCartPanel";
import { ProductGallery } from "./ProductGallery";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/PriceTag";
import type { AttributeMap, Product } from "@/lib/catalog";
import {
  defaultSelection,
  matchingVariant,
} from "@/lib/catalog/variants";
import { siteConfig } from "@/lib/config";

const perks = [
  { icon: Truck, text: siteConfig.deliveryNote },
  { icon: RotateCcw, text: "Unopened returns accepted for 14 days" },
  { icon: ShieldCheck, text: "Genuine product, sourced directly" },
];

export function ProductPurchase({
  product,
  department,
}: {
  product: Product;
  department?: { name: string; slug: string };
}) {
  const variants = product.variants;
  const [selected, setSelected] = useState<AttributeMap>(() =>
    variants && variants.length > 0 ? defaultSelection(variants) : {},
  );

  const variant = useMemo(
    () => (variants && variants.length > 0 ? matchingVariant(variants, selected) : undefined),
    [variants, selected],
  );

  const images =
    variant?.imageUrls && variant.imageUrls.length > 0 ? variant.imageUrls : product.imageUrls;
  const price = variant?.price ?? product.price;
  const onSale = Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
  const attributeEntries = Object.entries(product.attributes);

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:gap-16">
      <ProductGallery images={images} name={product.name} />
      <div className="flex flex-col lg:sticky lg:top-24 lg:self-start">
        <div className="flex flex-wrap items-center gap-1.5">
          {department && (
            <Link
              href={`/shop/${department.slug}`}
              className="label-xs text-ink-faint transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay"
            >
              {department.name}
            </Link>
          )}
          {product.brand && <span className="label-xs text-ink-muted">{product.brand}</span>}
          {onSale && <Badge variant="sale">Sale</Badge>}
          {product.tags?.includes("new") && <Badge variant="new">New</Badge>}
          {!product.inStock && <Badge variant="outline">Sold out</Badge>}
        </div>

        <h1 className="mt-2.5 text-2xl sm:text-[1.85rem] lg:text-[2rem]">{product.name}</h1>

        <div className="mt-3">
          <PriceTag price={price} compareAtPrice={product.compareAtPrice} size="lg" showDiscount />
        </div>

        {attributeEntries.length > 0 && (
          <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
            {attributeEntries.map(([key, value]) => (
              <div key={key} className="rounded-md border border-line bg-cream px-3 py-2">
                <dt className="label-xs text-ink-faint">{key}</dt>
                <dd className="mt-1 text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">{product.description}</p>

        <div className="my-6 border-t border-line" />

        <AddToCartPanel product={product} selected={selected} onSelectedChange={setSelected} />

        <ul className="mt-8 flex flex-col gap-2.5 rounded-md border border-line bg-cream p-3.5">
          {perks.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5">
              <Icon size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-clay" />
              <span className="text-[12px] leading-relaxed text-ink-muted">{text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
