"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import { useCustomer } from "@/components/customer/CustomerProvider";
import { AuthForm } from "@/components/customer/AuthForm";
import { useCart } from "@/components/cart/CartProvider";
import { useSaved } from "./SavedProvider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriceTag } from "@/components/ui/PriceTag";
import { Skeleton } from "@/components/ui/skeleton";

export function SavedView() {
  const { ready: customerReady, customer } = useCustomer();
  const { ready, items, remove } = useSaved();
  const { add } = useCart();

  if (!customerReady || !ready) {
    return (
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="flex gap-3.5 border-b border-line pb-4">
            <Skeleton className="h-24 w-[76px] shrink-0" />
            <div className="flex flex-1 flex-col gap-2 py-1">
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="mt-auto h-7 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto grid max-w-md gap-8">
        <EmptyState
          icon={<Heart size={17} strokeWidth={1.5} />}
          title="Save items for later"
          description="Sign in to keep a list, then add things to your cart when you're ready."
        />
        <AuthForm reason="saved" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={17} strokeWidth={1.5} />}
        title="Nothing saved yet"
        description="Tap the heart on a product to add it here."
        action={
          <Button asChild>
            <Link href="/shop">
              Browse the shop
              <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={`${item.productId}::${item.variantId ?? ""}`} className="flex gap-3.5 border-b border-line py-4">
          <Link
            href={`/product/${item.snapshot.slug}`}
            className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-md border border-line"
          >
            <Image src={item.snapshot.imageUrl} alt="" fill sizes="76px" className="object-cover" />
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-medium">
                  <Link href={`/product/${item.snapshot.slug}`} className="hover:text-clay">
                    {item.snapshot.name}
                  </Link>
                </h3>
                {item.snapshot.optionLabel && (
                  <p className="mt-0.5 text-[11px] text-ink-muted">{item.snapshot.optionLabel}</p>
                )}
              </div>
              <PriceTag price={item.snapshot.price} compareAtPrice={item.snapshot.compareAtPrice} />
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  add({
                    productId: item.productId,
                    variantId: item.variantId,
                    snapshot: item.snapshot,
                  })
                }
              >
                <ShoppingBag size={13} strokeWidth={1.5} />
                Add to cart
              </Button>
              <button
                type="button"
                onClick={() => remove(item.productId, item.variantId)}
                className="text-[11px] text-ink-faint underline decoration-line-strong underline-offset-2 hover:text-sale"
              >
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
