"use client";

import type { ReactNode } from "react";
import { useCart } from "./CartProvider";
import { siteConfig } from "@/lib/config";
import { cn, formatPrice } from "@/lib/utils";

export function OrderSummary({
  action,
  showProgress = true,
  className,
}: {
  action?: ReactNode;
  showProgress?: boolean;
  className?: string;
}) {
  const {
    subtotal,
    savings,
    shipping,
    total,
    count,
    qualifiesForFreeShipping,
    amountToFreeShipping,
  } = useCart();

  const progress = Math.min(100, (subtotal / siteConfig.freeShippingThreshold) * 100);

  return (
    <div className={cn("rounded-lg border border-line bg-cream p-4", className)}>
      <h2 className="label-xs pb-3 text-ink">Order summary</h2>

      <dl className="flex flex-col gap-2 border-t border-line pt-3 text-[13px]">
        <Row label={`Subtotal (${count})`} value={formatPrice(subtotal)} />
        {savings > 0 && (
          <Row label="Savings" value={`− ${formatPrice(savings)}`} accent="sale" />
        )}
        <Row
          label="Delivery"
          value={qualifiesForFreeShipping ? "Free" : formatPrice(shipping)}
          accent={qualifiesForFreeShipping ? "clay" : undefined}
        />
      </dl>

      <div className="mt-3 flex items-baseline justify-between border-t border-line pt-3">
        <span className="label-xs text-ink">Total</span>
        <span className="text-lg font-semibold tabular-nums text-ink">{formatPrice(total)}</span>
      </div>

      {showProgress && !qualifiesForFreeShipping && count > 0 && (
        <div className="mt-4">
          <div className="h-[3px] overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-clay transition-[width] duration-[var(--duration-ui)] ease-[var(--ease-out)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            Add {formatPrice(amountToFreeShipping)} for free delivery.
          </p>
        </div>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "sale" | "clay";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          accent === "sale" && "text-sale",
          accent === "clay" && "text-clay",
          !accent && "text-ink",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
