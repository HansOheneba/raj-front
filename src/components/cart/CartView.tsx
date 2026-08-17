"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "./CartProvider";
import { OrderSummary } from "./OrderSummary";
import { useSaved } from "@/components/saved/SavedProvider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriceTag } from "@/components/ui/PriceTag";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Skeleton } from "@/components/ui/skeleton";
import { savedItemFromLine } from "@/lib/saved/fromProduct";
import { formatPrice } from "@/lib/utils";

export function CartView() {
  const { ready, lines, setQuantity, remove, clear, count } = useCart();
  const { save } = useSaved();

  if (!ready) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((index) => (
            <div key={index} className="flex gap-3.5 border-b border-line pb-4">
              <Skeleton className="h-24 w-[76px] shrink-0" />
              <div className="flex flex-1 flex-col gap-2 py-1">
                <Skeleton className="h-2 w-16" />
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="mt-auto h-7 w-24" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag size={17} strokeWidth={1.5} />}
        title="Your cart is empty"
        description="Nothing here yet. Browse the shop and add what you need."
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
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:gap-12">
      <div>
        <div className="flex items-center justify-between border-b border-line pb-2.5">
          <p className="label-xs text-ink-muted">
            {count} {count === 1 ? "item" : "items"}
          </p>
          <button
            type="button"
            onClick={clear}
            className="text-[11px] text-ink-faint underline decoration-line-strong underline-offset-2 transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-sale"
          >
            Empty cart
          </button>
        </div>

        <ul>
          {lines.map((line) => (
            <li key={line.key} className="flex gap-3.5 border-b border-line py-4">
              <Link
                href={`/product/${line.snapshot.slug}`}
                className="relative h-24 w-[76px] shrink-0 overflow-hidden rounded-md border border-line"
              >
                <Image
                  src={line.snapshot.imageUrl}
                  alt=""
                  fill
                  sizes="76px"
                  className="object-cover"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[13px] font-medium">
                      <Link
                        href={`/product/${line.snapshot.slug}`}
                        className="hover:text-clay"
                      >
                        {line.snapshot.name}
                      </Link>
                    </h3>
                    {line.snapshot.optionLabel && (
                      <p className="mt-0.5 text-[11px] text-ink-muted">{line.snapshot.optionLabel}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(line.key)}
                    aria-label={`Remove ${line.snapshot.name}`}
                    className="shrink-0 text-ink-faint hover:text-sale"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
                  <div className="flex flex-col items-start gap-2">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(quantity) => setQuantity(line.key, quantity)}
                      min={0}
                      max={20}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const saved = save(savedItemFromLine(line));
                        if (saved) remove(line.key);
                      }}
                      className="text-[11px] text-ink-muted underline decoration-line-strong underline-offset-2 transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay"
                    >
                      Save for later
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] tabular-nums text-ink">{formatPrice(line.lineTotal)}</p>
                    {line.quantity > 1 && (
                      <p className="mt-0.5 text-[11px] text-ink-faint">
                        <PriceTag price={line.snapshot.price} /> each
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-5">
          <Button asChild variant="link">
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-[76px] lg:self-start">
        <OrderSummary
          action={
            <Button asChild className="w-full">
              <Link href="/checkout">
                Checkout
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
