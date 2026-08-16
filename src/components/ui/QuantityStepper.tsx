"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  label = "Quantity",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div
      className={cn(
        "inline-flex h-8 items-center rounded-md border border-line-strong bg-cream",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label={`Decrease ${label.toLowerCase()}`}
        className="flex h-full w-7 items-center justify-center text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay disabled:opacity-35 disabled:hover:text-ink-muted"
      >
        <Minus size={13} strokeWidth={1.5} />
      </button>

      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value.replace(/\D/g, ""), 10);
          onChange(Number.isNaN(parsed) ? min : clamp(parsed));
        }}
        className="h-full w-8 border-x border-line bg-transparent text-center text-xs tabular-nums outline-none"
      />

      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={`Increase ${label.toLowerCase()}`}
        className="flex h-full w-7 items-center justify-center text-ink-muted transition-colors duration-[var(--duration-ui)] ease-[var(--ease-out)] hover:text-clay disabled:opacity-35 disabled:hover:text-ink-muted"
      >
        <Plus size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}
