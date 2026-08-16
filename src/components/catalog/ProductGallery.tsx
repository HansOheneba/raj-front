"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const showThumbs = images.length > 1;

  useEffect(() => {
    setActive(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [images]);

  const syncActive = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.min(images.length - 1, Math.max(0, index)));
  }, [images.length]);

  const goTo = (index: number) => {
    setActive(index);
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex w-full flex-col gap-3 self-start lg:flex-row">
      {showThumbs && (
        <div className="no-rail hidden gap-2 lg:flex lg:w-16 lg:flex-col">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === active}
              className={cn(
                "relative aspect-square w-full shrink-0 overflow-hidden rounded-md border transition-[border-color] duration-[var(--duration-ui)] ease-[var(--ease-out)]",
                index === active ? "border-clay" : "border-line hover:border-line-strong",
              )}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div
          ref={scrollerRef}
          onScroll={syncActive}
          className="no-rail flex snap-x snap-mandatory touch-pan-x overflow-x-auto overscroll-x-contain rounded-md border border-line bg-cream"
        >
          {images.map((image, index) => (
            <div
              key={image}
              className="relative aspect-square min-w-full shrink-0 snap-start basis-full"
            >
              <Image
                src={image}
                alt={index === 0 ? name : `${name}, view ${index + 1}`}
                fill
                priority={index === 0}
                draggable={false}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {showThumbs && (
          <div className="mt-2.5 flex justify-center lg:hidden">
            <div className="flex items-center">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`View image ${index + 1} of ${images.length}`}
                  aria-current={index === active}
                  className="flex h-6 w-6 items-center justify-center"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-[background-color] duration-[var(--duration-ui)] ease-[var(--ease-out)]",
                      index === active ? "bg-ink" : "bg-ink/30",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
