import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full rounded-md border border-input bg-cream px-3 text-[13px] text-foreground placeholder:text-ink-faint outline-none transition-[border-color] duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:border-line-strong focus-visible:border-clay",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
