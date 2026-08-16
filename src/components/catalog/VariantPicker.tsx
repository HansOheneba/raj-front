"use client";

import { cn } from "@/lib/utils";
import type { AttributeMap, ProductVariant } from "@/lib/catalog";
import { availableValues, optionAxes } from "@/lib/catalog/variants";

export function VariantPicker({
  variants,
  selected,
  onChange,
}: {
  variants: ProductVariant[];
  selected: AttributeMap;
  onChange: (next: AttributeMap) => void;
}) {
  const axes = optionAxes(variants);
  if (axes.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {axes.map((axis) => {
        const available = availableValues(variants, axis.name, selected);
        return (
          <div key={axis.name}>
            <p className="label-xs mb-2 text-ink-muted">
              {axis.name}
              {selected[axis.name] && (
                <span className="ml-1.5 normal-case tracking-normal text-ink">
                  {selected[axis.name]}
                </span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {axis.values.map((value) => {
                const active = selected[axis.name] === value;
                const possible = available.has(value);
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={!possible}
                    aria-pressed={active}
                    onClick={() => onChange({ ...selected, [axis.name]: value })}
                    className={cn(
                      "h-9 min-w-10 rounded-md border px-3 text-[12px] transition-[background-color,border-color,color,transform] duration-[var(--duration-press)] ease-[var(--ease-out)] active:scale-[0.97] disabled:opacity-40",
                      active
                        ? "border-clay bg-clay-soft text-clay-dark"
                        : "border-line-strong bg-cream text-ink-muted hover:border-ink/30 hover:text-ink",
                    )}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
