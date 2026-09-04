import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("label-xs inline-flex items-center rounded-md px-1.5 py-[3px]", {
  variants: {
    variant: {
      default: "bg-clay-soft text-clay-dark",
      sale: "bg-sale text-cream",
      success: "bg-success-soft text-success",
      new: "bg-ink text-cream",
      outline: "border border-line-strong bg-cream/80 text-ink-muted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
