"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [images]);

  return (
    <div className="flex w-full flex-col-reverse gap-3 self-start sm:flex-row">
      {images.length > 1 && (
        <div className="no-rail flex gap-2 overflow-x-auto sm:w-16 sm:flex-col sm:overflow-visible">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === active}
              className={cn(
                "relative aspect-square w-14 shrink-0 overflow-hidden rounded-md border transition-[border-color] duration-[var(--duration-ui)] ease-[var(--ease-out)] sm:w-full",
                index === active ? "border-clay" : "border-line hover:border-line-strong",
              )}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative aspect-square flex-1 overflow-hidden rounded-md border border-line bg-cream">
        {images.map((image, index) => (
          <Image
            key={image}
            src={image}
            alt={index === 0 ? name : `${name}, view ${index + 1}`}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className={cn(
              "object-cover transition-opacity duration-[var(--duration-ui)] ease-[var(--ease-out)]",
              index === active ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>
    </div>
  );
}
