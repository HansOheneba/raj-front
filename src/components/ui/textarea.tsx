import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full resize-y rounded-md border border-input bg-cream px-3 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-ink-faint outline-none transition-[border-color] duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:border-line-strong focus-visible:border-clay",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
