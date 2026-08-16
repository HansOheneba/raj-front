import { cn, discountPercent, formatPrice } from "@/lib/utils";

export function PriceTag({
  price,
  compareAtPrice,
  size = "sm",
  showDiscount = false,
  className,
}: {
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "md" | "lg";
  showDiscount?: boolean;
  className?: string;
}) {
  const discount = discountPercent(price, compareAtPrice);
  const sizes = {
    sm: { current: "text-[13px]", was: "text-[11px]" },
    md: { current: "text-[15px]", was: "text-xs" },
    lg: { current: "font-heading text-2xl font-semibold", was: "text-[13px]" },
  }[size];

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className={cn("tabular-nums text-ink", sizes.current)}>{formatPrice(price)}</span>
      {discount > 0 && (
        <span className={cn("tabular-nums text-ink-faint line-through", sizes.was)}>
          {formatPrice(compareAtPrice!)}
        </span>
      )}
      {discount > 0 && showDiscount && (
        <span className={cn("text-sale", sizes.was)}>&minus;{discount}%</span>
      )}
    </span>
  );
}
