"use client";

import { Heart } from "lucide-react";
import { useSaved } from "./SavedProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SavedItem } from "@/lib/saved/types";

export function SaveButton({
  item,
  variant = "icon",
  className,
}: {
  item: SavedItem;
  variant?: "icon" | "label";
  className?: string;
}) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(item.productId, item.variantId);

  if (variant === "label") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => toggle(item)}
        aria-pressed={saved}
        className={className}
      >
        <Heart
          size={14}
          strokeWidth={1.5}
          className={saved ? "fill-clay text-clay" : undefined}
        />
        {saved ? "Saved" : "Save for later"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-label={saved ? `Remove ${item.snapshot.name} from your list` : `Save ${item.snapshot.name} for later`}
      aria-pressed={saved}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md border border-line-strong bg-cream/95 text-ink shadow-soft backdrop-blur-[2px] transition-[background-color,color,border-color] duration-[var(--duration-ui)] ease-[var(--ease-out)]",
        saved && "border-clay text-clay",
        className,
      )}
    >
      <Heart size={13} strokeWidth={1.5} className={saved ? "fill-clay" : undefined} />
    </button>
  );
}
