import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] transition-[transform,background-color,color,border-color,opacity] duration-[var(--duration-press)] ease-[var(--ease-out)]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-clay-dark",
        outline:
          "border border-input bg-cream/60 text-foreground hover:border-ink/35 hover:bg-sand",
        ghost: "text-muted-foreground hover:bg-sand hover:text-foreground",
        link: "text-foreground underline decoration-line-strong decoration-1 underline-offset-4 hover:decoration-clay hover:text-clay h-auto px-0",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
